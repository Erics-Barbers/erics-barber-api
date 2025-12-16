export class AuthResponseDto {
    constructor(
        public readonly accessToken: string,
        public readonly refreshToken: string,
    ) {}

    static create(props: {
        accessToken: string;
        refreshToken: string;
    }): AuthResponseDto {
        return new AuthResponseDto(props.accessToken, props.refreshToken);
    }
}
