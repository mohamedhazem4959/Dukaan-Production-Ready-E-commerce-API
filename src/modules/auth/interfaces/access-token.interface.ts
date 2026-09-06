export interface AccessToken {
    sub: number;
    username: string;
    email: string;
    birthDate: Date | undefined | null;
    phoneNumber: string | undefined | null ;
    role: string;
    hashedToken? :string | null 
}