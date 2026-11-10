// Request DTOs with server-side input validation (class-validator).
// All bodies are whitelisted by the global ValidationPipe, so unknown
// fields are stripped and every constraint below is enforced on the server.
import {
  IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString,
  Length, Matches, Max, Min, ArrayMaxSize, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

const PHONE_RE = /^[6-9]\d{9}$/; // Indian mobile, 10 digits, no +91 prefix
const NAME_RE = /^[\p{L}\p{M}\s.'()&-]{2,80}$/u;
const DATA_IMAGE_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
const PINCODE_RE = /^[1-9][0-9]{5}$/;

export class RegisterDto {
  @IsString() @Matches(NAME_RE, { message: 'Invalid name' })
  name: string;

  @IsString() @Matches(PHONE_RE, { message: 'Phone must be a 10-digit Indian mobile number' })
  phone: string;

  @IsOptional() @IsString() @Length(6, 120)
  email?: string;

  @IsString() @Length(8, 72, { message: 'Password must be at least 8 characters' })
  password: string;

  @IsOptional() @IsString()
  tenantSlug?: string;

  @IsOptional() @IsIn(['en', 'hi', 'mr'])
  language?: 'en' | 'hi' | 'mr';

  /** Google reCAPTCHA v3 token — verified when RECAPTCHA_SECRET_KEY is set. */
  @IsOptional() @IsString() @Length(20, 4000)
  captchaToken?: string;
}

export class LoginDto {
  @IsString() @Matches(PHONE_RE)
  phone: string;

  @IsString() @Length(1, 120)
  password: string;

  /** Optional business slug; defaults to primary Gurukripa tenant. Never trust client tenant IDs. */
  @IsOptional() @IsString() @Length(2, 64)
  tenantSlug?: string;

  /** Google reCAPTCHA v3 token — verified when RECAPTCHA_SECRET_KEY is set. */
  @IsOptional() @IsString() @Length(20, 4000)
  captchaToken?: string;
}

export class DealerRegisterDto extends RegisterDto {
  @IsString() @Matches(NAME_RE, { message: 'Invalid firm name' })
  firmName: string;

  @IsOptional() @IsString() @Matches(/^[0-9][A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z1-9]{3}$/, { message: 'Invalid GSTIN format' })
  gstin?: string;

  @IsOptional() @IsString() @Length(3, 40)
  licenseNo?: string;

  @IsString() @Length(6, 200)
  dealerAddress: string;

  @IsString() @Length(2, 60)
  dealerCity: string;
}

export class UpdateProfileDto {
  @IsOptional() @IsString() @Matches(NAME_RE)
  name?: string;

  @IsOptional() @IsString() @Length(6, 120)
  email?: string;

  @IsOptional() @IsIn(['en', 'hi', 'mr'])
  language?: 'en' | 'hi' | 'mr';
}

export class AddressDto {
  @IsString() @Matches(NAME_RE)
  label: string;

  @IsString() @Length(4, 200)
  line1: string;

  @IsString() @Length(2, 60)
  city: string;

  @IsString() @Length(2, 60)
  state: string;

  @IsString() @Matches(PINCODE_RE, { message: 'Invalid 6-digit pincode' })
  pincode: string;

  @IsOptional() @IsBoolean()
  isDefault?: boolean;
}

export class EnquiryLineDto {
  @IsOptional() @IsString()
  productId?: string;

  @IsString() @Length(2, 120)
  productName: string;

  @IsNumber() @Min(1) @Max(10_000_000)
  quantity: number;

  @IsString() @IsIn(['bricks', 'trolleys', 'cuft', 'bags', 'pieces', 'trip'])
  unit: string;
}

export class CreateEnquiryDto {
  @IsArray() @ArrayMaxSize(10) @ValidateNested({ each: true }) @Type(() => EnquiryLineDto)
  lines: EnquiryLineDto[];

  @IsString() @Length(4, 200)
  siteLocation: string;

  @IsOptional() @IsString() @Length(0, 1000)
  notes?: string;

  @IsOptional() @IsString() @Matches(PHONE_RE)
  contactPhone?: string;

  @IsOptional() @IsString() @Matches(NAME_RE)
  contactName?: string;

  @IsOptional() @IsArray() @ArrayMaxSize(5)
  @Matches(DATA_IMAGE_RE, { each: true, message: 'Attachments must be jpeg/png/webp data-URL images' })
  attachments?: string[];

  @IsOptional() @IsString()
  addressId?: string;

  /** Google reCAPTCHA v3 token — verified when RECAPTCHA_SECRET_KEY is set. */
  @IsOptional() @IsString() @Length(20, 4000)
  captchaToken?: string;
}

export class QuotationLineDto {
  @IsOptional() @IsString()
  productId?: string;

  @IsString() @Length(2, 120)
  name: string;

  @IsNumber() @Min(1) @Max(10_000_000)
  quantity: number;

  @IsString() @IsIn(['bricks', 'trolleys', 'cuft', 'bags', 'pieces', 'trip'])
  unit: string;

  @IsNumber() @Min(0) @Max(10_000_000)
  unitPrice: number;
}

export class CreateQuotationDto {
  @IsArray() @ArrayMaxSize(50) @ValidateNested({ each: true }) @Type(() => QuotationLineDto)
  lines: QuotationLineDto[];

  @IsOptional() @IsNumber() @Min(0) @Max(1_000_000)
  discountAmount?: number;

  @IsOptional() @IsString() @Length(0, 2000)
  notes?: string;

  @IsOptional() @IsInt() @Min(1) @Max(90)
  validDays?: number;

  @IsOptional() @IsBoolean()
  sendNow?: boolean;
}

export class StaffAssignDto {
  @IsString()
  staffId: string;
}

export class OrderStatusDto {
  @IsString() @IsIn(['PRODUCTION', 'DISPATCHED', 'DELIVERED', 'CANCELLED'])
  status: string;

  @IsOptional() @IsString() @Length(0, 500)
  note?: string;

  @IsOptional() @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/)
  expectedDelivery?: string;
}

export class DeviceTokenDto {
  @IsString() @Length(20, 512)
  token: string;

  @IsString() @IsIn(['android', 'ios', 'web'])
  platform: 'android' | 'ios' | 'web';

  @IsOptional()
  preferences?: { orderUpdates?: boolean; quotations?: boolean; announcements?: boolean };
}

export class DevicePrefsDto {
  @IsOptional() @IsBoolean() orderUpdates?: boolean;
  @IsOptional() @IsBoolean() quotations?: boolean;
  @IsOptional() @IsBoolean() announcements?: boolean;
}

export class AnnouncementDto {
  @IsString() @Length(3, 160)
  title: string;

  @IsString() @Length(3, 2000)
  body: string;

  @IsOptional() @IsIn(['ALL', 'CUSTOMER', 'DEALER'])
  audience?: 'ALL' | 'CUSTOMER' | 'DEALER';

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}

export class SavedSiteDto {
  @IsString() @Matches(NAME_RE)
  name: string;

  @IsString() @Length(4, 200)
  address: string;

  @IsString() @Length(2, 60)
  city: string;

  @IsOptional() @IsNumber() lat?: number;
  @IsOptional() @IsNumber() lng?: number;
}

export class DealerApprovalDto {
  @IsString() @IsIn(['APPROVED', 'REJECTED'])
  status: 'APPROVED' | 'REJECTED';

  @IsOptional() @IsNumber() @Min(0) @Max(50)
  dealerDiscountPct?: number;
}
