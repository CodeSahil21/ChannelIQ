import { CreateUserProfile, UpdateUserProfile } from './types';

/**
 * Utility to calculate profile completion percentage
 * @param profile User profile data
 * @returns number Percentage of profile completion (0-100)
 */
export function calculateProfileCompletion(profile: Record<string, unknown> | CreateUserProfile | UpdateUserProfile): number {
    const fields = [
        'fullName',
        'profilePic',
        'jobTitle',
        'department',
        'phoneNumber',
        'workEmail',
        'bio',
        'location',
        'timezone',
        'skills',
        'languages',
        'managerId',
        'managerName',
        'linkedinUrl',
        'githubUrl',
        'portfolioUrl',
        'twitterUrl'
    ];

    let filled = 0;
    let totalFields = fields.length;
    const profileData = profile as Record<string, unknown>;

    fields.forEach(field => {
        if (Array.isArray(profileData[field])) {
            if ((profileData[field] as unknown[]).length > 0) filled++;
        } else if (profileData[field] !== undefined && profileData[field] !== null && profileData[field] !== '') {
            filled++;
        }
    });

    return Math.round((filled / totalFields) * 100);
}

/**
 * Builds search vector text from user profile data
 * Used for full text search
 */
export function buildSearchVector(profile: Record<string, unknown> | CreateUserProfile | UpdateUserProfile): string {
    const profileData = profile as Record<string, unknown>;
    return [
        profileData.fullName || '',
        profileData.email || '',
        profileData.jobTitle || '',
        profileData.department || '',
        Array.isArray(profileData.skills) ? (profileData.skills as string[]).join(' ') : '',
        Array.isArray(profileData.languages) ? (profileData.languages as string[]).join(' ') : '',
        profileData.bio || '',
        profileData.location || ''
    ].filter(Boolean).join(' ');
}