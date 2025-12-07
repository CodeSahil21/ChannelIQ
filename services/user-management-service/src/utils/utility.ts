export function calculateProfileCompletion(profile: Record<string, unknown>): number {
    const fields = [
        'fullName', 'profilePic', 'jobTitle', 'department', 'phoneNumber', 'workEmail',
        'bio', 'location', 'timezone', 'skills', 'languages', 'managerId', 'managerName',
        'linkedinUrl', 'githubUrl', 'portfolioUrl', 'twitterUrl'
    ];
    let filled = 0;
    fields.forEach(field => {
        if (Array.isArray(profile[field])) {
            if (profile[field].length > 0) filled++;
        } else if (profile[field]) {
            filled++;
        }
    });
    return Math.round((filled / fields.length) * 100);
}