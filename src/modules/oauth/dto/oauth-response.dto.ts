import { ApiProperty } from '@nestjs/swagger';

export class SocialLookupResponseDataDto {
  @ApiProperty({ example: true })
  registered!: boolean;
}

export class SocialLookupResponseDto {
  @ApiProperty({ example: 200 })
  code!: number;

  @ApiProperty({ example: 'Lookup successful' })
  message!: string;

  @ApiProperty({ type: SocialLookupResponseDataDto })
  data!: SocialLookupResponseDataDto;
}
