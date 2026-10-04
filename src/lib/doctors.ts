import type { StaticImageData } from "next/image";
import k from "@/assets/doctors/k.jpg";
import kFace from "@/assets/doctors/k-face.jpg";
import kim from "@/assets/doctors/kim.jpg";
import kimFace from "@/assets/doctors/kim-face.jpg";
import min from "@/assets/doctors/min.jpg";
import minFace from "@/assets/doctors/min-face.jpg";
import mun from "@/assets/doctors/mun.jpg";
import munFace from "@/assets/doctors/mun-face.jpg";
import nabi from "@/assets/doctors/nabi.jpg";
import nabiFace from "@/assets/doctors/nabi-face.jpg";
import pak from "@/assets/doctors/pak.jpg";
import pakFace from "@/assets/doctors/pak-face.jpg";

export type Doctor = {
  id: string;
  nickname: string;
  fullName: string;
  license: string;
  /** Kept in English, as published on the clinic's website. */
  credentials: string[];
  photo: StaticImageData;
  face: StaticImageData;
};

/**
 * The clinic's plastic surgeons, from the "Our plastic surgeons" section of
 * thekliniquethailand.com/about-us. Showcase content only: bookable
 * practitioners still come from the staff table.
 */
export const DOCTORS: Doctor[] = [
  {
    id: "k",
    nickname: "Dr. K",
    fullName: "Kampanart Tangamatakul, M.D.",
    license: "12334",
    credentials: [
      "Doctor of Medicine, Chulalongkorn University",
      "Certificate of Plastic and Reconstructive Surgery, Faculty of Medicine, Chulalongkorn University",
      "Member, Royal College of Surgeons of Thailand",
      "Over 20 years of experience in plastic surgery",
    ],
    photo: k,
    face: kFace,
  },
  {
    id: "kim",
    nickname: "Dr. Kim",
    fullName: "Natthacha Vamvanij, M.D.",
    license: "31833",
    credentials: [
      "Doctor of Medicine (First Class Honors), Siriraj Hospital, Mahidol University",
      "Thai Board of Plastic Surgery, Siriraj Hospital, Mahidol University",
      "Supermicrosurgery training, Tokyo Hospital, Japan",
      "Rhinoplasty and Asian eyelid training, Korean College of Cosmetic Surgery",
    ],
    photo: kim,
    face: kimFace,
  },
  {
    id: "pak",
    nickname: "Dr. Pak",
    fullName: "Parinya Yanpisitkul, M.D.",
    license: "30653",
    credentials: [
      "Doctor of Medicine, Prince of Songkhla University",
      "Thai Board certified in Plastic and Reconstructive Surgery, Siriraj Hospital",
      "Visiting scholarship, Asan Medical Centre and BK Hospital, South Korea",
      "Master Class Face and Brow Lift, IMCAS World Congress",
    ],
    photo: pak,
    face: pakFace,
  },
  {
    id: "nabi",
    nickname: "Dr. Nabi",
    fullName: "Kusuma Tangamatakul, M.D.",
    license: "48066",
    credentials: [
      "Doctor of Medicine, Chulalongkorn University (First-class honors)",
      "Thai Board of Plastic and Reconstructive Surgery, Chulalongkorn University",
      "Member, Royal College of Surgeons of Thailand",
      "Member, Society of Aesthetic Plastic Surgeons of Thailand",
    ],
    photo: nabi,
    face: nabiFace,
  },
  {
    id: "mun",
    nickname: "Dr. Mun",
    fullName: "Peeraya Ganoksil, M.D.",
    license: "43325",
    credentials: [
      "Plastic Surgery, Chulalongkorn University",
      "Clinical observation, Asan Medical Center, Seoul",
      "Clinical observation in Plastic Surgery, Juntendo University, Tokyo",
    ],
    photo: mun,
    face: munFace,
  },
  {
    id: "min",
    nickname: "Dr. Min",
    fullName: "Apirut Hongsuwan, M.D.",
    license: "53161",
    credentials: [
      "Doctor of Medicine, Vajira Hospital",
      "Board of Plastic and Reconstruction Surgery, Vajira Hospital",
      "Member, Society of Plastic and Reconstructive Surgeons of Thailand",
    ],
    photo: min,
    face: minFace,
  },
];
