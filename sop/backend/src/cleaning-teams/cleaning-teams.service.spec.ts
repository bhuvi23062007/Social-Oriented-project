import { Test, TestingModule } from '@nestjs/testing';
import { CleaningTeamsService } from './cleaning-teams.service';

describe('CleaningTeamsService', () => {
  let service: CleaningTeamsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CleaningTeamsService],
    }).compile();

    service = module.get<CleaningTeamsService>(CleaningTeamsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
