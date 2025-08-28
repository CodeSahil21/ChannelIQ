import prisma from '@/db/index'
import { CreateUser } from '@/utils/types';

export const CreateUserService = async ({userId,email,fullName,profilePic,}: CreateUser) => {
        // Check if user exists
        const isUserExists = await prisma.user.findUnique({
            where: { email: email }
        });

        if (isUserExists) {
            throw new Error("User already exists");
        }

        const user = await prisma.user.create({
            data: {
                id: userId,
                email: email,
                fullName: fullName,
                profilePic: profilePic
            },
        });
        return user;
}

