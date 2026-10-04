import { Test, TestingModule } from '@nestjs/testing';
import { CleaningTeamsController } from './cleaning-teams.controller';

describe('CleaningTeamsController', () => {
  let controller: CleaningTeamsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CleaningTeamsController],
    }).compile();

    controller = module.get<CleaningTeamsController>(CleaningTeamsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
