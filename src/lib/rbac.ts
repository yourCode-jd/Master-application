export function assertPermission(permissions:ReadonlySet<string>,permission:string){if(!permissions.has(permission))throw new Error(`Missing permission: ${permission}`);}
