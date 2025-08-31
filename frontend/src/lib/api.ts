import axios from 'axios';
import { User } from '@/types/user';

export const fetchUserById = async (id: string): Promise<User> => {
  const response = await axios.get<User>(
    `http://localhost:3001/api/users/${id}`
  );
  return response.data;
};
