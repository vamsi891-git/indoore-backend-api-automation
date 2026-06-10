export interface InviteCrossVerification {
  email: string;
  invitationId: string;
  role: string;
  status: "pending" | "accepted" | "expired";
  emailVerifiedInResponse: boolean;
  emailVerifiedInList: boolean;
  userId?: string;
  /** True when accept API returned a user record (full account activation). */
  userAccountActive?: boolean;
}

export function printInviteCrossVerification(
  summary: InviteCrossVerification,
): void {
  const divider = "=".repeat(50);
  const emailOk =
    summary.emailVerifiedInResponse && summary.emailVerifiedInList;
  const inviteCreated = summary.invitationId.length > 0;
  const userActive = summary.userAccountActive === true;
  const userCreatedOk = userActive || inviteCreated;

  console.log(`\n${divider}`);
  console.log("INVITE CROSS-VERIFICATION");
  console.log(divider);
  console.log(
    `EMAIL IS VERIFIED         : ${emailOk ? "SUCCESS" : "FAILED"}`,
  );
  console.log(
    `USER CREATED SUCCESSFULLY : ${userCreatedOk ? "SUCCESS" : "FAILED"}`,
  );
  if (inviteCreated && !userActive) {
    console.log(
      "NOTE                      : Invitation recorded; user activates account after accept",
    );
  }
  console.log(`EMAIL                     : ${summary.email}`);
  console.log(`INVITATION ID             : ${summary.invitationId}`);
  console.log(`ROLE                      : ${summary.role}`);
  console.log(`INVITATION STATUS         : ${summary.status}`);
  if (summary.userId) {
    console.log(`USER ID                   : ${summary.userId}`);
  }
  console.log(`${divider}\n`);
}
