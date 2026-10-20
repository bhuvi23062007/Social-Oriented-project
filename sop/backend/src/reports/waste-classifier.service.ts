import { Injectable, Logger } from '@nestjs/common';
import { WasteType } from '@prisma/client';

export interface Classification {
  isWaste: boolean;
  wasteType: WasteType;
  confidence: number;
  reason: string;
}

const PROMPT = `You classify photos for a city waste-reporting app. Reply with ONLY this JSON:
{"isWaste": boolean, "wasteType": "LITTER"|"BIN_OVERFLOW"|"GARBAGE_PILE"|"DRAIN_BLOCK"|"BULK_DUMP", "confidence": number between 0 and 1, "reason": "short string"}
Types: LITTER = a few scattered items (bottles, wrappers) on a street or roadside. BIN_OVERFLOW = a public bin overflowing. GARBAGE_PILE = a pile or several bags of dumped garbage. DRAIN_BLOCK = waste blocking a drain, gutter or water flow. BULK_DUMP = large dumping (construction debris, furniture, truckloads).
Set isWaste=false if the photo shows no visible waste (selfie, indoor object, clean street, screenshot).`;

@Injectable()
export class WasteClassifierService {
  private logger = new Logger(WasteClassifierService.name);

  // returns null when AI is unavailable, caller falls back to a default
  async classifyUrl(url: string): Promise<Classification | null> {
    try {
      const key = process.env.GROQ_API_KEY;
      if (!key) {
        this.logger.warn('GROQ_API_KEY missing, skipping AI classification');
        return null;
      }

      const img = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!img.ok) throw new Error(`image fetch ${img.status}`);
      const mime = img.headers.get('content-type') || 'image/jpeg';
      const b64 = Buffer.from(await img.arrayBuffer()).toString('base64');

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.GROQ_VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct',
          temperature: 0,
          max_tokens: 200,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: PROMPT },
                { type: 'image_url', image_url: { url: `data:${mime};base64,${b64}` } },
              ],
            },
          ],
        }),
        signal: AbortSignal.timeout(20000),
      });

      const data: any = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data?.error ?? data));

      const text: string = data.choices?.[0]?.message?.content ?? '';
      const m = text.match(/\{[\s\S]*\}/);
      if (!m) throw new Error('no JSON in reply');
      const j = JSON.parse(m[0]);

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
}