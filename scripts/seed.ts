/**
 * Demo data: treatment names come from thekliniquethailand.com (skin aesthetics
 * menu). Durations are estimates and prices are left empty ("on consultation")
 * because the website does not publish them; the clinic edits both in admin.
 *
 * Usage: npm run db:seed  (safe to re-run: catalog is only created once)
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import * as s from "../src/db/schema";
import { hashPassword } from "../src/lib/password";

type L = s.LocalizedText;

const CATALOG: { category: L; items: { name: string; durationMin: number; description: L }[] }[] = [
  {
    category: { en: "Face Lifting", th: "ยกกระชับใบหน้า", zh: "面部提拉" },
    items: [
      { name: "Ulthera SPT+", durationMin: 90, description: { en: "Non-surgical ultrasound lift for face and neck.", th: "ยกกระชับด้วยอัลตราซาวด์ ไม่ต้องผ่าตัด", zh: "非手术超声波面颈部提拉。" } },
      { name: "Ulthera Prime", durationMin: 90, description: { en: "Latest-generation Ulthera with real-time imaging.", th: "อัลเทอราเจเนอเรชันล่าสุด พร้อมภาพอัลตราซาวด์แบบเรียลไทม์", zh: "最新一代超声刀，实时成像。" } },
      { name: "Ultraformer III", durationMin: 60, description: { en: "Focused ultrasound for lifting and contouring.", th: "อัลตราซาวด์แบบโฟกัส ยกกระชับและปรับรูปหน้า", zh: "聚焦超声提拉塑形。" } },
      { name: "Thermage FLX Pro", durationMin: 90, description: { en: "Radiofrequency skin tightening.", th: "กระชับผิวด้วยคลื่นวิทยุ", zh: "射频紧致皮肤。" } },
    ],
  },
  {
    category: { en: "Anti-Wrinkle & Filler", th: "ลดริ้วรอยและฟิลเลอร์", zh: "抗皱与填充" },
    items: [
      { name: "Anti-Wrinkle", durationMin: 30, description: { en: "Smooths expression lines.", th: "ลดเลือนริ้วรอยจากการแสดงสีหน้า", zh: "淡化表情纹。" } },
      { name: "Filler / Volume LIFT", durationMin: 45, description: { en: "Restores volume and contour.", th: "เติมเต็มและปรับรูปหน้า", zh: "恢复面部容量与轮廓。" } },
    ],
  },
  {
    category: { en: "Biostimulator", th: "ไบโอสติมูเลเตอร์", zh: "生物刺激剂" },
    items: [
      { name: "Sculptra", durationMin: 45, description: { en: "Stimulates your own collagen.", th: "กระตุ้นการสร้างคอลลาเจนของผิว", zh: "刺激自身胶原蛋白生成。" } },
      { name: "Radiesse", durationMin: 45, description: { en: "Lifts and firms with collagen stimulation.", th: "ยกกระชับและกระตุ้นคอลลาเจน", zh: "提拉紧致并刺激胶原。" } },
      { name: "Harmonyca", durationMin: 45, description: { en: "Hybrid hyaluronic acid and collagen booster.", th: "ไฮยาลูรอนิกผสานการกระตุ้นคอลลาเจน", zh: "玻尿酸与胶原双效。" } },
    ],
  },
  {
    category: { en: "Glass Skin", th: "ผิวใสกลาสสกิน", zh: "水光肌" },
    items: [
      { name: "REJUGLOW", durationMin: 60, description: { en: "Deep hydration for a dewy glow.", th: "เติมความชุ่มชื้นล้ำลึก ผิวโกลว์", zh: "深层补水，焕发光泽。" } },
      { name: "Absolute Glow", durationMin: 60, description: { en: "Brightening glow treatment.", th: "ทรีตเมนต์ผิวกระจ่างใส", zh: "亮肤焕采护理。" } },
      { name: "White Peptides", durationMin: 45, description: { en: "Peptide brightening for even tone.", th: "เปปไทด์เพื่อผิวกระจ่างใสสม่ำเสมอ", zh: "多肽美白，均匀肤色。" } },
    ],
  },
  {
    category: { en: "IV Drip", th: "ดริปวิตามิน", zh: "静脉滴注" },
    items: [
      { name: "Supreme Youth", durationMin: 45, description: { en: "Anti-aging vitamin drip.", th: "ดริปวิตามินชะลอวัย", zh: "抗衰老维生素滴注。" } },
      { name: "Active Brain Booster", durationMin: 45, description: { en: "Energy and focus drip.", th: "ดริปเสริมพลังและสมาธิ", zh: "提升精力与专注力。" } },
      { name: "Absolute Detox", durationMin: 45, description: { en: "Detox and recovery drip.", th: "ดริปดีท็อกซ์และฟื้นฟู", zh: "排毒修复滴注。" } },
      { name: "Crystal White", durationMin: 45, description: { en: "Brightening drip.", th: "ดริปผิวกระจ่างใส", zh: "亮白滴注。" } },
    ],
  },
  {
    category: { en: "Hair Removal", th: "กำจัดขน", zh: "脱毛" },
    items: [{ name: "Gentle YAG Hair Removal", durationMin: 30, description: { en: "Laser hair removal for all skin types.", th: "เลเซอร์กำจัดขน เหมาะกับทุกสภาพผิว", zh: "适合各种肤质的激光脱毛。" } }],
  },
  {
    category: { en: "Body", th: "กระชับสัดส่วน", zh: "身体塑形" },
    items: [
      { name: "CoolSculpting ELITE", durationMin: 75, description: { en: "Freezes stubborn fat.", th: "สลายไขมันด้วยความเย็น", zh: "冷冻溶脂。" } },
      { name: "Emsculpt Neo", durationMin: 30, description: { en: "Builds muscle and burns fat.", th: "เสริมกล้ามเนื้อและเผาผลาญไขมัน", zh: "增肌燃脂。" } },
      { name: "Vanquish Slim", durationMin: 45, description: { en: "Contact-free fat reduction.", th: "ลดไขมันแบบไม่สัมผัสผิว", zh: "非接触式减脂。" } },
    ],
  },
  {
    category: { en: "Others", th: "อื่น ๆ", zh: "其他" },
    items: [
      { name: "Cool Laser", durationMin: 45, description: { en: "Resurfacing for texture and tone.", th: "ปรับผิวเรียบเนียนและสีผิวสม่ำเสมอ", zh: "改善肤质与肤色。" } },
      { name: "GOLD 24 Karat", durationMin: 60, description: { en: "Signature 24K gold facial.", th: "ทรีตเมนต์ทองคำ 24K", zh: "招牌24K黄金护理。" } },
      { name: "Detox Bright", durationMin: 60, description: { en: "Purifying and brightening facial.", th: "ทรีตเมนต์ดีท็อกซ์ผิวกระจ่างใส", zh: "净化亮肤护理。" } },
    ],
  },
  {
    category: { en: "Surgery Consultation", th: "ปรึกษาศัลยกรรม", zh: "手术咨询" },
    items: [
      { name: "Face Surgery Consultation", durationMin: 30, description: { en: "Rhinoplasty, eyelids, facelift and more. Meet a surgeon.", th: "เสริมจมูก ทำตา ดึงหน้า และอื่น ๆ พบศัลยแพทย์", zh: "隆鼻、眼部、拉皮等，面诊外科医生。" } },
      { name: "Body & Breast Surgery Consultation", durationMin: 30, description: { en: "Breast surgery, liposuction, tummy tuck. Meet a surgeon.", th: "ศัลยกรรมหน้าอก ดูดไขมัน ผ่าตัดหน้าท้อง พบศัลยแพทย์", zh: "胸部手术、吸脂、腹壁整形，面诊外科医生。" } },
    ],
  },
];

// Demo practitioners; weekday 0 = Sunday. Hours in minutes from midnight.
const STAFF: { name: string; days: number[]; start: number; end: number; categories: string[] }[] = [
  { name: "Dr. Ploy", days: [1, 2, 3, 4, 5, 6], start: 10 * 60, end: 19 * 60, categories: ["Face Lifting", "Anti-Wrinkle & Filler", "Biostimulator", "Surgery Consultation"] },
  { name: "Dr. Nat", days: [0, 2, 3, 4, 5, 6], start: 11 * 60, end: 20 * 60, categories: ["Face Lifting", "Anti-Wrinkle & Filler", "Biostimulator", "IV Drip", "Surgery Consultation"] },
  { name: "Khun Mai", days: [0, 1, 2, 3, 4, 5, 6], start: 10 * 60, end: 20 * 60, categories: ["Glass Skin", "IV Drip", "Hair Removal", "Body", "Others"] },
  { name: "Khun Fern", days: [0, 1, 3, 4, 5, 6], start: 10 * 60, end: 20 * 60, categories: ["Glass Skin", "Hair Removal", "Body", "Others"] },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema: s });

  const existing = await db.select().from(s.services).limit(1);
  if (existing.length === 0) {
    const serviceIdsByCategory = new Map<string, number[]>();
    for (const [ci, group] of CATALOG.entries()) {
      const [cat] = await db.insert(s.categories).values({ name: group.category, sortOrder: ci }).returning();
      const rows = await db
        .insert(s.services)
        .values(group.items.map((it, i) => ({ categoryId: cat.id, name: { en: it.name, th: it.name, zh: it.name }, description: it.description, durationMin: it.durationMin, priceThb: null, sortOrder: i })))
        .returning({ id: s.services.id });
      serviceIdsByCategory.set(group.category.en, rows.map((r) => r.id));
    }
    for (const p of STAFF) {
      const [row] = await db.insert(s.staff).values({ name: p.name }).returning();
      await db.insert(s.workingHours).values(p.days.map((weekday) => ({ staffId: row.id, weekday, startMin: p.start, endMin: p.end })));
      const ids = p.categories.flatMap((c) => serviceIdsByCategory.get(c) ?? []);
      await db.insert(s.staffServices).values(ids.map((serviceId) => ({ staffId: row.id, serviceId })));
    }
    console.log("Seeded catalog and practitioners.");
  } else {
    console.log("Catalog already present, skipped.");
  }

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    if (password.length < 10) throw new Error("ADMIN_PASSWORD must be at least 10 characters");
    const passwordHash = await hashPassword(password);
    const [found] = await db.select().from(s.adminUsers).where(eq(s.adminUsers.email, email));
    if (found) await db.update(s.adminUsers).set({ passwordHash }).where(eq(s.adminUsers.id, found.id));
    else await db.insert(s.adminUsers).values({ email, passwordHash });
    console.log(`Admin account ready: ${email}`);
  }
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
