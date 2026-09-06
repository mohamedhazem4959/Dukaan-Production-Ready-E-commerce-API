export interface TempUser {
    username: string;
    email: string;
    password_hash: string;
    birth_date: string;
    phone_number: string | undefined;
}