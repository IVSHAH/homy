import { ApiProperty } from "@nestjs/swagger";
import { UserResponseDto } from "src/module/users/dto/user-response.dto";

export class LoginResponseDto {
  @ApiProperty({ description: 'JWT токе доступа'})
  accessToken: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;

  constructor(accessToken: string, user: UserResponseDto) {
    this.accessToken = accessToken;
    this.user = user;
  }
}