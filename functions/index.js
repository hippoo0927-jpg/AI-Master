/**
 * Firebase Cloud Functions v2 - 자동 구독 만료 스케줄러
 * 매일 자정(00:00)에 실행되어 만료된 프리미엄 유저를 free 등급으로 변경합니다.
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { getFirestore } = require("firebase-admin/firestore");
const { initializeApp } = require("firebase-admin/app");

initializeApp();
const db = getFirestore();

// 매일 자정 실행 (Cron: 0 0 * * *)
exports.checkExpiredSubscriptions = onSchedule("0 0 * * *", async (event) => {
  const now = new Date();
  const usersRef = db.collection("users");
  
  // 1. 프리미엄이면서 만료일이 현재보다 이전인 유저 쿼리
  const expiredUsersQuery = usersRef
    .where("grade", "==", "premium")
    .where("expiryDate", "<", now);

  try {
    const snapshot = await expiredUsersQuery.get();
    
    if (snapshot.empty) {
      console.log("만료된 구독자가 없습니다.");
      return null;
    }

    const batch = db.batch();
    
    snapshot.docs.forEach((doc) => {
      console.log(`만료 처리 유저: ${doc.data().email} (${doc.id})`);
      batch.update(doc.ref, {
        grade: "free",
        // expiryDate는 이력을 위해 남겨두거나 null 처리 가능
        // expiryDate: null 
      });
    });

    await batch.commit();
    console.log(`${snapshot.size}명의 유저가 free 등급으로 자동 변경되었습니다.`);
  } catch (error) {
    console.error("구독 만료 처리 중 오류 발생:", error);
  }
  
  return null;
});
