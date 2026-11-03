import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/tenant_provider.dart';
import 'services/estimator_engine.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => TenantProvider()),
      ],
      child: const BrickSupplySaaSApp(),
    ),
  );
}

class BrickSupplySaaSApp extends StatelessWidget {
  const BrickSupplySaaSApp({super.key});

  @override
  Widget build(BuildContext context) {
    final tenant = context.watch<TenantProvider>();

    return MaterialApp(
      title: tenant.currentTenant?.name ?? 'Brick Supply SaaS',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primaryColor: tenant.primaryColor,
        colorScheme: ColorScheme.fromSeed(
          seedColor: tenant.primaryColor,
          primary: tenant.primaryColor,
          secondary: tenant.secondaryColor,
        ),
        useMaterial3: true,
      ),
      home: const SaaSMainShell(),
    );
  }
}

class SaaSMainShell extends StatefulWidget {
  const SaaSMainShell({super.key});

  @override
  State<SaaSMainShell> createState() => _SaaSMainShellState();
}

class _SaaSMainShellState extends State<SaaSMainShell> {
  int _selectedIndex = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<TenantProvider>().loadTenantBySlug('http://localhost:3000', 'gurukripa');
    });
  }

  @override
  Widget build(BuildContext context) {
    final tenantProv = context.watch<TenantProvider>();
    final tenant = tenantProv.currentTenant;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          tenant?.name ?? 'Brick Supply Portal',
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        backgroundColor: tenantProv.primaryColor,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.sync),
            tooltip: 'Sync Offline Queue',
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Offline records synchronized with NestJS backend')),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.business),
            tooltip: 'Switch Tenant',
            onPressed: () => _showTenantSwitcher(context),
          ),
        ],
      ),
      body: _buildCurrentTab(),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (idx) => setState(() => _selectedIndex = idx),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.calculate), label: 'Estimator'),
          NavigationDestination(icon: Icon(Icons.inventory_2), label: 'Catalog'),
          NavigationDestination(icon: Icon(Icons.local_shipping), label: 'Dispatches'),
          NavigationDestination(icon: Icon(Icons.receipt_long), label: 'Invoices'),
        ],
      ),
    );
  }

  Widget _buildCurrentTab() {
    if (_selectedIndex == 0) return const EstimatorStudioView();
    if (_selectedIndex == 1) return const CatalogView();
    if (_selectedIndex == 2) return const DispatchesView();
    return const InvoicesView();
  }

  void _showTenantSwitcher(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Switch Active Tenant / Kiln', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            ListTile(
              leading: const CircleAvatar(backgroundColor: Color(0xFFC8460A), child: Icon(Icons.local_fire_department, color: Colors.white)),
              title: const Text('Gurukripa Bricks Industry'),
              subtitle: const Text('Jaunpur • Primary Kiln'),
              onTap: () {
                context.read<TenantProvider>().loadTenantBySlug('http://localhost:3000', 'gurukripa');
                Navigator.pop(ctx);
              },
            ),
            ListTile(
              leading: const CircleAvatar(backgroundColor: Color(0xFF0284C7), child: Icon(Icons.factory, color: Colors.white)),
              title: const Text('Awadh Brick Kiln & Suppliers'),
              subtitle: const Text('Varanasi • Distributor Hub'),
              onTap: () {
                context.read<TenantProvider>().loadTenantBySlug('http://localhost:3000', 'awadh-bricks');
                Navigator.pop(ctx);
              },
            ),
          ],
        ),
      ),
    );
  }
}

class EstimatorStudioView extends StatefulWidget {
  const EstimatorStudioView({super.key});

  @override
  State<EstimatorStudioView> createState() => _EstimatorStudioViewState();
}

class _EstimatorStudioViewState extends State<EstimatorStudioView> {
  double _length = 20;
  double _height = 10;
  final double _thickness = 9;
  final double _rate = 7.05; // Awwal rate

  @override
  Widget build(BuildContext context) {
    final result = EstimatorEngine.calculateWall(
      lengthFt: _length,
      heightFt: _height,
      thicknessInches: _thickness,
      unitPrice: _rate,
    );

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('3-in-1 Wall Estimation Studio', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Text('Wall Length: ${_length.toInt()} ft'),
                  Slider(
                    value: _length,
                    min: 5,
                    max: 100,
                    divisions: 19,
                    onChanged: (v) => setState(() => _length = v),
                  ),
                  Text('Wall Height: ${_height.toInt()} ft'),
                  Slider(
                    value: _height,
                    min: 5,
                    max: 30,
                    divisions: 25,
                    onChanged: (v) => setState(() => _height = v),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            color: Colors.amber.shade50,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Estimation Summary (Includes 5% Breakage)', style: TextStyle(fontWeight: FontWeight.bold)),
                  const Divider(),
                  Text('Total Bricks Required: ${result.bricksNeeded} pcs', style: const TextStyle(fontSize: 16)),
                  Text('Trolleys (4,000 bricks/tr): ${result.trolleysCount} trolleys', style: const TextStyle(fontSize: 16)),
                  Text('Cement Needed: ${result.cementBags} bags', style: const TextStyle(fontSize: 16)),
                  Text('Sand Volume: ${result.sandCuFt} cu.ft', style: const TextStyle(fontSize: 16)),
                  const SizedBox(height: 8),
                  Text(
                    'Estimated Cost: ₹${result.totalEstimatedCost.toInt()}',
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFFC8460A)),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class CatalogView extends StatelessWidget {
  const CatalogView({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: const [
        ListTile(
          leading: Icon(Icons.check_box, color: Colors.green),
          title: Text('Awwal Bricks (आव्वल ईंट)'),
          subtitle: Text('₹7.05/piece • ₹28,200 per trolley (4,000 bricks)'),
          trailing: Text('In Stock', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
        ),
        Divider(),
        ListTile(
          leading: Icon(Icons.check_box, color: Colors.green),
          title: Text('Laal Peti Bricks (लाल पेटी ईंट)'),
          subtitle: Text('₹6.25/piece • ₹25,000 per trolley (4,000 bricks)'),
          trailing: Text('In Stock', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
        ),
        Divider(),
        ListTile(
          leading: Icon(Icons.star, color: Colors.orange),
          title: Text('Shiv Eent Grade-A'),
          subtitle: Text('₹12.00/piece • Premium double-fired load bearing'),
          trailing: Text('In Stock (10k+)', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
        ),
      ],
    );
  }
}

class DispatchesView extends StatelessWidget {
  const DispatchesView({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: ListTile(
            leading: const Icon(Icons.local_shipping, color: Color(0xFFC8460A)),
            title: const Text('Trolley Delivery #TR-8091'),
            subtitle: const Text('Destination: Civil Lines, Jaunpur • 4,000 Awwal Bricks'),
            trailing: ElevatedButton(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Delivery confirmed & saved to SQLite offline ledger')),
                );
              },
              child: const Text('Confirm Delivery'),
            ),
          ),
        ),
      ],
    );
  }
}

class InvoicesView extends StatelessWidget {
  const InvoicesView({super.key});

  @override
  Widget build(BuildContext context) {
    final gst = EstimatorEngine.calculateReverseGst(28200);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('GST Tax Invoice #INV-2026-0041', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const Text('Customer: Ramesh Construction, Jaunpur'),
                const Divider(),
                Text('Taxable Base Value: ₹${gst.taxableValue.toInt()}'),
                Text('CGST (2.5%): ₹${gst.cgst.toInt()}'),
                Text('SGST (2.5%): ₹${gst.sgst.toInt()}'),
                const SizedBox(height: 8),
                Text('Grand Total: ₹${gst.grandTotal.toInt()}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFFC8460A))),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
