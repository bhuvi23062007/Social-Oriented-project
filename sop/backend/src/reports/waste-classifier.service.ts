import { Injectable, Logger } from '@nestjs/common';
import { WasteType } from '@prisma/client';

export interface Classification {
  isWaste: boolean;
  wasteType: WasteType;
  confidence: number;
  reason: string;
}

export interface CleanCheck {
  cleaned: boolean;
  sameLocation: boolean;
  confidence: number;
  reason: string;
}

const PROMPT = `You classify photos for a city waste-reporting app. Reply with ONLY this JSON:
{"isWaste": boolean, "wasteType": "LITTER"|"BIN_OVERFLOW"|"GARBAGE_PILE"|"DRAIN_BLOCK"|"BULK_DUMP", "confidence": number between 0 and 1, "reason": "short string"}
Types: LITTER = a few scattered items (bottles, wrappers) on a street or roadside. BIN_OVERFLOW = a public bin overflowing. GARBAGE_PILE = a pile or several bags of dumped garbage. DRAIN_BLOCK = waste blocking a drain, gutter or water flow. BULK_DUMP = large dumping (construction debris, furniture, truckloads).
Set isWaste=false if the photo shows no visible waste (selfie, indoor object, clean street, screenshot).`;

const AFTER_PROMPT = `You inspect ONE photo taken after a cleanup of a public spot. Reply with ONLY this JSON:
{"wasteVisible": boolean, "confidence": number between 0 and 1, "reason": "short string"}
wasteVisible=true if ANY garbage, litter, bags, debris or dumped items are clearly visible. wasteVisible=false if the area looks clean.`;

const SAME_PROMPT = `Image 1 is BEFORE, image 2 is AFTER. Do they plausibly show the same place (same road, wall, bin, building or surroundings, from any angle or lighting)? Reply with ONLY this JSON:
{"sameLocation": boolean, "confidence": number between 0 and 1}`;

@Injectable()
export class WasteClassifierService {
  private logger = new Logger(WasteClassifierService.name);

  private async toDataUrl(url: string) {
    const img = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!img.ok) throw new Error(`image fetch ${img.status}`);
    const mime = img.headers.get('content-type') || 'image/jpeg';
    return `data:${mime};base64,${Buffer.from(await img.arrayBuffer()).toString('base64')}`;
  }

   private async ask(content: any[], timeoutMs: number): Promise<any | null> {
    const key = process.env.AI_API_KEY;
    const models = [process.env.AI_MODEL, process.env.AI_MODEL_FALLBACK].filter(Boolean) as string[];
    if (!key || models.length === 0) {
      this.logger.warn('AI_API_KEY / AI_MODEL not set, skipping AI');
      return null;
    }
    const base = process.env.AI_BASE_URL || 'https://openrouter.ai/api/v1';

    let lastErr = '';
    for (const model of models) {
      for (let attempt = 0; attempt < 2; attempt++) {
        let res: any;
        try {
          res = await fetch(`${base}/chat/completions`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model,
              temperature: 0,
              max_tokens: 2000,
              messages: [{ role: 'user', content }],
            }),
            signal: AbortSignal.timeout(timeoutMs),
          });
        } catch (e) {
          lastErr = (e as Error).message;
          continue;
        }

        const data: any = await res.json().catch(() => ({}));
        if (res.ok) {
          const m = String(data.choices?.[0]?.message?.content ?? '').match(/\{[\s\S]*\}/);
          if (!m) {
            lastErr = 'no JSON in reply';
            break;
          }
          return JSON.parse(m[0]);
        }

        lastErr = JSON.stringify(data?.error ?? data);
        if (!(res.status === 429 || res.status >= 500)) break;
        await new Promise((r) => setTimeout(r, 1500));
      }
      this.logger.warn(`Model ${model} failed: ${lastErr.slice(0, 160)}`);
    }
    throw new Error(lastErr);
  }

  // returns null when AI is unavailable, caller falls back to a default
  async classifyUrl(url: string): Promise<Classification | null> {
    try {
      const j = await this.ask(
        [
          { type: 'text', text: PROMPT },
          { type: 'image_url', image_url: { url: await this.toDataUrl(url) } },
        ],
        25000,
      );
      if (!j) return null;
      this.logger.log(`Waste check: ${JSON.stringify(j)}`);
      const type = Object.values(WasteType).includes(j.wasteType) ? j.wasteType : WasteType.LITTER;
      return {
        isWaste: j.isWaste !== false,
        wasteType: type,
        confidence: Number(j.confidence) || 0,
        reason: String(j.reason ?? ''),
      };
    } catch (e) {
      this.logger.warn(`AI classification failed: ${(e as Error).message}`);
      return null;
    }
  }

  // only the AFTER photo decides "cleaned"; "same spot" is a soft signal for the admin
  async verifyCleaned(beforeUrl: string, afterUrl: string): Promise<CleanCheck | null> {
    try {
      const [before, after] = await Promise.all([this.toDataUrl(beforeUrl), this.toDataUrl(afterUrl)]);

      const [a, s] = await Promise.all([
        this.ask(
          [
            { type: 'text', text: AFTER_PROMPT },
            { type: 'image_url', image_url: { url: after } },
          ],
          25000,
        ),
        this.ask(
          [
            { type: 'text', text: SAME_PROMPT },
            { type: 'text', text: 'BEFORE:' },
            { type: 'image_url', image_url: { url: before } },
            { type: 'text', text: 'AFTER:' },
            { type: 'image_url', image_url: { url: after } },
          ],
          25000,
        ).catch(() => null),
      ]);
      if (!a) return null;
      this.logger.log(`Clean check: after=${JSON.stringify(a)} same=${JSON.stringify(s)}`);

      return {
        cleaned: a.wasteVisible !== true,
        sameLocation: s ? s.sameLocation !== false : true,
        confidence: Number(a.confidence) || 0,
        reason: String(a.reason ?? ''),
      };
    } catch (e) {
      this.logger.warn(`AI clean check failed: ${(e as Error).message}`);
      return null;
    }
  }
}