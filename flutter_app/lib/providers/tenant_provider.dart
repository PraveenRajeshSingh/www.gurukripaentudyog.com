import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../models/models.dart';

class TenantProvider with ChangeNotifier {
  TenantModel? _currentTenant;
  bool _isLoading = false;
  String _errorMessage = '';

  TenantModel? get currentTenant => _currentTenant;
  bool get isLoading => _isLoading;
  String get errorMessage => _errorMessage;

  Color get primaryColor {
    if (_currentTenant == null) return const Color(0xFFC8460A);
    try {
      final hex = _currentTenant!.primaryColorHex.replaceAll('#', '');
      return Color(int.parse('FF$hex', radix: 16));
    } catch (_) {
      return const Color(0xFFC8460A);
    }
  }

  Color get secondaryColor {
    if (_currentTenant == null) return const Color(0xFF2A2A2A);
    try {
      final hex = _currentTenant!.secondaryColorHex.replaceAll('#', '');
      return Color(int.parse('FF$hex', radix: 16));
    } catch (_) {
      return const Color(0xFF2A2A2A);
    }
  }

  Future<bool> loadTenantBySlug(String backendUrl, String slug) async {
    _isLoading = true;
    _errorMessage = '';
    notifyListeners();

    try {
      final response = await http.get(Uri.parse('$backendUrl/api/v1/tenants/$slug/branding'));
      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        if (body['success'] == true && body['data'] != null) {
          _currentTenant = TenantModel.fromJson(body['data']);
          _isLoading = false;
          notifyListeners();
          return true;
        }
      }
      _errorMessage = 'Failed to load tenant configuration';
    } catch (e) {
      // Fallback for default Gurukripa branding when offline
      _currentTenant = TenantModel(
        id: 'tenant-gurukripa-001',
        slug: 'gurukripa',
        name: 'Gurukripa Bricks Industry',
        legalName: 'Gurukripa Ent Udyog Pvt Ltd',
        gstin: '09AAACG7481M1Z2',
        phone: '+91 94150 12345',
        email: 'contact@gurukripaentudyog.com',
        address: 'Shahganj Road, Kheta Sarai, Jaunpur, UP',
        primaryColorHex: '#C8460A',
        secondaryColorHex: '#2A2A2A',
      );
    }

    _isLoading = false;
    notifyListeners();
    return true;
  }
}
