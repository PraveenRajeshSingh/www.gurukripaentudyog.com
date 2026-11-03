import { PricingEngineService } from '../pricing/pricing.service';
import { PlatformStoreService } from './store.service';
import { NotifyService } from './notify.service';
import { AuthenticatedUser } from '../types/domain';
import { PlatformEnquiry, PlatformOrder, PlatformQuotation } from './types';
import { CreateQuotationDto, OrderStatusDto } from './dto';
export declare class WorkflowService {
    private readonly store;
    private readonly notify;
    private readonly pricing;
    constructor(store: PlatformStoreService, notify: NotifyService, pricing: PricingEngineService);
    private assertStaff;
    private assertManager;
    private moveEnquiry;
    reviewEnquiry(user: AuthenticatedUser, enquiryId: string): Promise<PlatformEnquiry>;
    assignEnquiry(user: AuthenticatedUser, enquiryId: string, staffId: string): Promise<PlatformEnquiry>;
    createQuotation(user: AuthenticatedUser, enquiryId: string, dto: CreateQuotationDto): Promise<PlatformQuotation>;
    sendQuotation(user: AuthenticatedUser, quotationId: string): Promise<PlatformQuotation>;
    respondToQuotation(user: AuthenticatedUser, quotationId: string, approve: boolean, reason?: string): Promise<PlatformOrder | null>;
    changeOrderStatus(user: AuthenticatedUser, orderId: string, dto: OrderStatusDto): Promise<PlatformOrder>;
    mustFindEnquiry(id: string): PlatformEnquiry;
    private findEnquiryById;
    mustFindQuotation(id: string): PlatformQuotation;
    mustFindOrder(id: string): PlatformOrder;
}
