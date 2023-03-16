export class ResponseLogDto {
  readonly requestId!: string;
  readonly code!: number;
  readonly message!: string;
  elapsed!: number;
}
