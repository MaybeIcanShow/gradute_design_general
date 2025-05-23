export interface UserCreate {
  username: string;
  email: string;
  password: string;
}

export interface User {
  username: string;
  email: string;
  id: number;
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
  user: User;
}
