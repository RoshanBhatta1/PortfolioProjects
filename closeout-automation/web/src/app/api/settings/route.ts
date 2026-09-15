import { NextRequest, NextResponse } from "next/server";
import { getCompanySettings, updateCompanySettings } from "@/lib/db";

export async function GET() {
  return NextResponse.json({ settings: getCompanySettings() });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const settings = updateCompanySettings({
    companyName: body.companyName,
    addressLine1: body.addressLine1,
    cityProvincePostal: body.cityProvincePostal,
    phone: body.phone,
    fax: body.fax,
    email: body.email,
    tagline: body.tagline,
    signerName: body.signerName,
    signerTitle: body.signerTitle,
    defaultWarrantyYears: body.defaultWarrantyYears ? Number(body.defaultWarrantyYears) : undefined,
  });
  return NextResponse.json({ settings });
}
