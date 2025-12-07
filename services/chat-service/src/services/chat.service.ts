import prisma from '../db/index'
import {CreateUser} from '../utils/types'

export const CreateUserService = async ({userId,email,fullName,profilePic,}: CreateUser) => {
        // Check if user exists
        const isUserExists = await prisma.userCache.findUnique({
            where: { email: email }
        });

        if(isUserExists){
            throw new Error("User already exists");
        }

        const user = await prisma.userCache.create({
            data: {
                id: userId,
                email,
                fullName,
                profilePic: profilePic
            },
        });
        return user;
}
