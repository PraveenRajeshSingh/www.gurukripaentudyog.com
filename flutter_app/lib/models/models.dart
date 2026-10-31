class TenantModel {
  final String id;
  final String slug;
  final String name;
  final String legalName;
  final String gstin;
  final String phone;
  final String email;
  final String address;
  final String primaryColorHex;
  final String secondaryColorHex;

  TenantModel({
    required this.id,
    required this.slug,
    required this.name,
    required this.legalName,
    required this.gstin,
    required this.phone,
    required this.email,
    required this.address,
    required this.primaryColorHex,
    required this.secondaryColorHex,
  });

  factory TenantModel.fromJson(Map<String, dynamic> json) {
    return TenantModel(
      id: json['id'] ?? '',
      slug: json['slug'] ?? '',
      name: json['name'] ?? '',
      legalName: json['legalName'] ?? '',
      gstin: json['gstin'] ?? '',
      phone: json['phone'] ?? '',
      email: json['email'] ?? '',
      address: json['address'] ?? '',
      primaryColorHex: json['primaryColor'] ?? '#C8460A',
      secondaryColorHex: json['secondaryColor'] ?? '#2A2A2A',
    );
  }
}

class BrickProductModel {
  final String id;
  final String tenantId;
  final String sku;
  final String name;
  final String category;
  final double unitPrice;
  final int trolleyCapacity;
  final double trolleyRate;
  final String description;
  final List<String> features;

  BrickProductModel({
    required this.id,
    required this.tenantId,
    required this.sku,
    required this.name,
    required this.category,
    required this.unitPrice,
    required this.trolleyCapacity,
    required this.trolleyRate,
    required this.description,
    required this.features,
  });

  factory BrickProductModel.fromJson(Map<String, dynamic> json) {
    return BrickProductModel(
      id: json['id'] ?? '',
      tenantId: json['tenantId'] ?? '',
      sku: json['sku'] ?? '',
      name: json['name'] ?? '',
      category: json['category'] ?? '',
      unitPrice: (json['unitPrice'] as num?)?.toDouble() ?? 0.0,
      trolleyCapacity: json['trolleyCapacity'] ?? 4000,
      trolleyRate: (json['trolleyRate'] as num?)?.toDouble() ?? 0.0,
      description: json['description'] ?? '',
      features: (json['features'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'tenant_id': tenantId,
      'sku': sku,
      'name': name,
      'category': category,
      'unit_price': unitPrice,
      'trolley_capacity': trolleyCapacity,
      'trolley_rate': trolleyRate,
      'description': description,
    };
  }
}

class OrderModel {
  final String id;
  final String tenantId;
  final String customerName;
  final String customerPhone;
  final String deliveryAddress;
  final double subtotal;
  final double cgst;
  final double sgst;
  final double totalAmount;
  final String status;
  final String createdAt;

  OrderModel({
    required this.id,
    required this.tenantId,
    required this.customerName,
    required this.customerPhone,
    required this.deliveryAddress,
    required this.subtotal,
    required this.cgst,
    required this.sgst,
    required this.totalAmount,
    required this.status,
    required this.createdAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'tenant_id': tenantId,
      'customer_name': customerName,
      'customer_phone': customerPhone,
      'delivery_address': deliveryAddress,
      'subtotal': subtotal,
      'cgst': cgst,
      'sgst': sgst,
      'total_amount': totalAmount,
      'status': status,
      'created_at': createdAt,
    };
  }
}
