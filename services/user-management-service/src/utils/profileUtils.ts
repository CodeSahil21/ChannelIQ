/**
 * Utility to calculate profile completion percentage
 * @param profile User profile data
 * @returns number Percentage of profile completion (0-100)
 */
export function calculateProfileCompletion(profile: any): number {
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

    fields.forEach(field => {
        if (Array.isArray(profile[field])) {
            if (profile[field].length > 0) filled++;
        } else if (profile[field] !== undefined && profile[field] !== null && profile[field] !== '') {
            filled++;
        }
    });

    return Math.round((filled / totalFields) * 100);
}

/**
 * Builds search vector text from user profile data
 * Used for full text search
 */
export function buildSearchVector(profile: any): string {
    return [
        profile.fullName || '',
        profile.email || '',
        profile.jobTitle || '',
        profile.department || '',
        Array.isArray(profile.skills) ? profile.skills.join(' ') : '',
        Array.isArray(profile.languages) ? profile.languages.join(' ') : '',
        profile.bio || '',
        profile.location || ''
    ].filter(Boolean).join(' ');
}