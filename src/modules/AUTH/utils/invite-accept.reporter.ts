export interface InviteAcceptSummary {
  email: string;
  userId: string;
  role: string;
  status: string;
  permissionCount: number;
  tokenType: string;
  expiresIn: number;
}

export function printInviteAcceptSummary(summary: InviteAcceptSummary): void {
  const divider = "=".repeat(50);

  console.log(`\n${divider}`);
  console.log("INVITE ACCEPT VALIDATION");
  console.log(divider);
  console.log("USER CREATED SUCCESSFULLY   : SUCCESS");
  console.log("ACCESS TOKEN ISSUED         : SUCCESS");
  console.log(`EMAIL                     : ${summary.email}`);
  console.log(`USER ID                   : ${summary.userId}`);
  console.log(`ROLE                      : ${summary.role}`);
  console.log(`STATUS                    : ${summary.status}`);
  console.log(`PERMISSIONS               : ${summary.permissionCount}`);
  console.log(`TOKEN TYPE                : ${summary.tokenType}`);
  console.log(`EXPIRES IN (sec)          : ${summary.expiresIn}`);
  console.log(`${divider}\n`);
}
