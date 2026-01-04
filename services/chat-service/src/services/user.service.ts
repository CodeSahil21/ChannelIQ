import prisma from '../db';

interface CreateUserData {
  userId: number;
  email: string;
  fullName: string;
  profilePic: string;
}



// Create User Service
export const CreateUserService = async (data: CreateUserData): Promise<void> => {
  await prisma.user.upsert({
    where: { id: data.userId },
    update: {
      email: data.email,
      fullName: data.fullName,
      profileUrl: data.profilePic
    },
    create: {
      id: data.userId,
      email: data.email,
      fullName: data.fullName,
      profileUrl: data.profilePic
    }
  });
};

// Update User Full Name with auto-creation fallback
export const updateUserFullName = async (userId: number, fullName: string, email: string, profilePic: string): Promise<void> => {
  await prisma.user.upsert({
    where: { id: userId },
    update: { fullName },
    create: {
      id: userId,
      email,
      fullName,
      profileUrl: profilePic
    }
  });
};

// Update User Profile URL with auto-creation fallback
export const updateUserProfileUrl = async (userId: number, profileUrl: string | null, email?: string, fullName?: string): Promise<void> => {
  if (email && fullName) {
    // If we have user data, use upsert to handle missing users
    await prisma.user.upsert({
      where: { id: userId },
      update: { profileUrl },
      create: {
        id: userId,
        email,
        fullName,
        profileUrl
      }
    });
  } else {
    // Fallback to update only if user exists
    await prisma.user.update({
      where: { id: userId },
      data: { profileUrl },
    });
  }
};

// Delete User by ID
export const deleteUserById = async (userId: number): Promise<void> => {
  await prisma.user.delete({
    where: { id: userId }
  });
};