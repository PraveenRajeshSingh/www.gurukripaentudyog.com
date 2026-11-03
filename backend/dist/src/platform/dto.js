"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealerApprovalDto = exports.SavedSiteDto = exports.AnnouncementDto = exports.DevicePrefsDto = exports.DeviceTokenDto = exports.OrderStatusDto = exports.StaffAssignDto = exports.CreateQuotationDto = exports.QuotationLineDto = exports.CreateEnquiryDto = exports.EnquiryLineDto = exports.AddressDto = exports.UpdateProfileDto = exports.DealerRegisterDto = exports.LoginDto = exports.RegisterDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const PHONE_RE = /^[6-9]\d{9}$/;
const NAME_RE = /^[\p{L}\p{M}\s.'()&-]{2,80}$/u;
const DATA_IMAGE_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
const PINCODE_RE = /^[1-9][0-9]{5}$/;
class RegisterDto {
}
exports.RegisterDto = RegisterDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(NAME_RE, { message: 'Invalid name' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(PHONE_RE, { message: 'Phone must be a 10-digit Indian mobile number' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(6, 120),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(8, 72, { message: 'Password must be at least 8 characters' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "tenantSlug", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['en', 'hi', 'mr']),
    __metadata("design:type", String)
], RegisterDto.prototype, "language", void 0);
class LoginDto {
}
exports.LoginDto = LoginDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(PHONE_RE),
    __metadata("design:type", String)
], LoginDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 120),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
class DealerRegisterDto extends RegisterDto {
}
exports.DealerRegisterDto = DealerRegisterDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(NAME_RE, { message: 'Invalid firm name' }),
    __metadata("design:type", String)
], DealerRegisterDto.prototype, "firmName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[0-9][A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z1-9]{3}$/, { message: 'Invalid GSTIN format' }),
    __metadata("design:type", String)
], DealerRegisterDto.prototype, "gstin", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(3, 40),
    __metadata("design:type", String)
], DealerRegisterDto.prototype, "licenseNo", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(6, 200),
    __metadata("design:type", String)
], DealerRegisterDto.prototype, "dealerAddress", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 60),
    __metadata("design:type", String)
], DealerRegisterDto.prototype, "dealerCity", void 0);
class UpdateProfileDto {
}
exports.UpdateProfileDto = UpdateProfileDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(NAME_RE),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(6, 120),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['en', 'hi', 'mr']),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "language", void 0);
class AddressDto {
}
exports.AddressDto = AddressDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(NAME_RE),
    __metadata("design:type", String)
], AddressDto.prototype, "label", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(4, 200),
    __metadata("design:type", String)
], AddressDto.prototype, "line1", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 60),
    __metadata("design:type", String)
], AddressDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 60),
    __metadata("design:type", String)
], AddressDto.prototype, "state", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(PINCODE_RE, { message: 'Invalid 6-digit pincode' }),
    __metadata("design:type", String)
], AddressDto.prototype, "pincode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AddressDto.prototype, "isDefault", void 0);
class EnquiryLineDto {
}
exports.EnquiryLineDto = EnquiryLineDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnquiryLineDto.prototype, "productId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 120),
    __metadata("design:type", String)
], EnquiryLineDto.prototype, "productName", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(10_000_000),
    __metadata("design:type", Number)
], EnquiryLineDto.prototype, "quantity", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['bricks', 'trolleys', 'cuft', 'bags', 'pieces', 'trip']),
    __metadata("design:type", String)
], EnquiryLineDto.prototype, "unit", void 0);
class CreateEnquiryDto {
}
exports.CreateEnquiryDto = CreateEnquiryDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(10),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => EnquiryLineDto),
    __metadata("design:type", Array)
], CreateEnquiryDto.prototype, "lines", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(4, 200),
    __metadata("design:type", String)
], CreateEnquiryDto.prototype, "siteLocation", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 1000),
    __metadata("design:type", String)
], CreateEnquiryDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(PHONE_RE),
    __metadata("design:type", String)
], CreateEnquiryDto.prototype, "contactPhone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(NAME_RE),
    __metadata("design:type", String)
], CreateEnquiryDto.prototype, "contactName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(5),
    (0, class_validator_1.Matches)(DATA_IMAGE_RE, { each: true, message: 'Attachments must be jpeg/png/webp data-URL images' }),
    __metadata("design:type", Array)
], CreateEnquiryDto.prototype, "attachments", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEnquiryDto.prototype, "addressId", void 0);
class QuotationLineDto {
}
exports.QuotationLineDto = QuotationLineDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QuotationLineDto.prototype, "productId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 120),
    __metadata("design:type", String)
], QuotationLineDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(10_000_000),
    __metadata("design:type", Number)
], QuotationLineDto.prototype, "quantity", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['bricks', 'trolleys', 'cuft', 'bags', 'pieces', 'trip']),
    __metadata("design:type", String)
], QuotationLineDto.prototype, "unit", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(10_000_000),
    __metadata("design:type", Number)
], QuotationLineDto.prototype, "unitPrice", void 0);
class CreateQuotationDto {
}
exports.CreateQuotationDto = CreateQuotationDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(50),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => QuotationLineDto),
    __metadata("design:type", Array)
], CreateQuotationDto.prototype, "lines", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1_000_000),
    __metadata("design:type", Number)
], CreateQuotationDto.prototype, "discountAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 2000),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(90),
    __metadata("design:type", Number)
], CreateQuotationDto.prototype, "validDays", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateQuotationDto.prototype, "sendNow", void 0);
class StaffAssignDto {
}
exports.StaffAssignDto = StaffAssignDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StaffAssignDto.prototype, "staffId", void 0);
class OrderStatusDto {
}
exports.OrderStatusDto = OrderStatusDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['PRODUCTION', 'DISPATCHED', 'DELIVERED', 'CANCELLED']),
    __metadata("design:type", String)
], OrderStatusDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 500),
    __metadata("design:type", String)
], OrderStatusDto.prototype, "note", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d{4}-\d{2}-\d{2}$/),
    __metadata("design:type", String)
], OrderStatusDto.prototype, "expectedDelivery", void 0);
class DeviceTokenDto {
}
exports.DeviceTokenDto = DeviceTokenDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(20, 512),
    __metadata("design:type", String)
], DeviceTokenDto.prototype, "token", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['android', 'ios', 'web']),
    __metadata("design:type", String)
], DeviceTokenDto.prototype, "platform", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], DeviceTokenDto.prototype, "preferences", void 0);
class DevicePrefsDto {
}
exports.DevicePrefsDto = DevicePrefsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], DevicePrefsDto.prototype, "orderUpdates", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], DevicePrefsDto.prototype, "quotations", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], DevicePrefsDto.prototype, "announcements", void 0);
class AnnouncementDto {
}
exports.AnnouncementDto = AnnouncementDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(3, 160),
    __metadata("design:type", String)
], AnnouncementDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(3, 2000),
    __metadata("design:type", String)
], AnnouncementDto.prototype, "body", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['ALL', 'CUSTOMER', 'DEALER']),
    __metadata("design:type", String)
], AnnouncementDto.prototype, "audience", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AnnouncementDto.prototype, "isActive", void 0);
class SavedSiteDto {
}
exports.SavedSiteDto = SavedSiteDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(NAME_RE),
    __metadata("design:type", String)
], SavedSiteDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(4, 200),
    __metadata("design:type", String)
], SavedSiteDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 60),
    __metadata("design:type", String)
], SavedSiteDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SavedSiteDto.prototype, "lat", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SavedSiteDto.prototype, "lng", void 0);
class DealerApprovalDto {
}
exports.DealerApprovalDto = DealerApprovalDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['APPROVED', 'REJECTED']),
    __metadata("design:type", String)
], DealerApprovalDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(50),
    __metadata("design:type", Number)
], DealerApprovalDto.prototype, "dealerDiscountPct", void 0);
//# sourceMappingURL=dto.js.map