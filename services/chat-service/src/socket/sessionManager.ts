export class SessionManager {
  // Encapsulate the userGroups Map within the class
  private static userGroups = new Map<string, Set<string>>();
  static isUserInGroup(socketId: string, groupId: string): boolean {
    return this.userGroups.get(socketId)?.has(groupId) || false;
  }

  static addUserToGroup(socketId: string, groupId: string): void {
    if (!this.userGroups.has(socketId)) {
      this.userGroups.set(socketId, new Set());
    }
    this.userGroups.get(socketId)!.add(groupId); // Safe to use ! after explicit check
  }

  static removeUserFromGroup(socketId: string, groupId: string): void {
    const userGroupSet = this.userGroups.get(socketId);
    if (userGroupSet) {
      userGroupSet.delete(groupId);
      // Clean up empty sets to prevent memory leaks
      if (userGroupSet.size === 0) {
        this.userGroups.delete(socketId);
      }
    }
  }

  static removeUserFromAllGroups(socketId: string): void {
    this.userGroups.delete(socketId);
  }

  static validateGroupAccess(socketId: string, groupId: string): void {
    if (!this.isUserInGroup(socketId, groupId)) {
      throw new Error("Must join group first"); // Remove internal IDs from error message
    }
  }
}