import { Test, TestingModule } from '@nestjs/testing';
import { UploadsService } from './uploads.service';
import { STORAGE_PROVIDER } from './constants/storage.constants';

describe('UploadsService', () => {
  let service: UploadsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadsService,
        {
          provide: STORAGE_PROVIDER,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<UploadsService>(UploadsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
