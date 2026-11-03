export interface Vendor {
  type: 'dealer' | 'energy' | 'logistics' | 'govt';
  name: string;
  location: string;
  desc: string;
  contact: string;
  since: string;
  icon: string;
}

export const VENDORS: Vendor[] = [
  {
    type: 'dealer',
    name: 'Singh Construction Materials',
    location: 'Jaunpur City, UP',
    desc: 'Premier authorized dealer for all Gurukripa brick grades. 8+ years partnership.',
    contact: '+91 94150 12345',
    since: '2016',
    icon: '🏪'
  },
  {
    type: 'dealer',
    name: 'Varanasi Building Depot',
    location: 'Lanka, Varanasi, UP',
    desc: 'Authorized distributor serving Varanasi district with same-day stock availability.',
    contact: '+91 98390 56789',
    since: '2018',
    icon: '🏬'
  },
  {
    type: 'energy',
    name: 'Shyam Coal & Fuel Suppliers',
    location: 'Jalalpur, Jaunpur, UP',
    desc: 'Primary kiln energy partner supplying premium-grade coal for our double-fired process.',
    contact: '+91 94510 33210',
    since: '2010',
    icon: '⚡'
  },
  {
    type: 'energy',
    name: 'UP Biomass Energy Pvt. Ltd.',
    location: 'Sultanpur, UP',
    desc: 'Biomass fuel supplier supporting eco-friendly kiln operations across seasonal demand.',
    contact: '+91 99190 77002',
    since: '2020',
    icon: '🌿'
  },
  {
    type: 'logistics',
    name: 'Ramesh Transport Co.',
    location: 'Jaunpur–Varanasi Highway',
    desc: 'Fleet of 12 trolley trucks ensuring same-day delivery across Jaunpur & Varanasi districts.',
    contact: '+91 98765 43210',
    since: '2012',
    icon: '🚚'
  },
  {
    type: 'logistics',
    name: 'Patel Logistics Fleet',
    location: 'Shahganj, Jaunpur, UP',
    desc: 'Heavy logistics partner for bulk institutional orders across Eastern UP.',
    contact: '+91 97730 11223',
    since: '2019',
    icon: '🚛'
  },
  {
    type: 'govt',
    name: 'Jaunpur PWD (Public Works Dept)',
    location: 'Jaunpur District, UP',
    desc: 'Government approved supplier for public infrastructure, roads and municipal building projects.',
    contact: 'Govt. Tender',
    since: '2015',
    icon: '🏛️'
  },
  {
    type: 'govt',
    name: 'UP Housing Board Projects',
    location: 'Uttar Pradesh',
    desc: 'Empaneled supplier for affordable housing schemes under PMAY across Jaunpur zone.',
    contact: 'Official Tender',
    since: '2021',
    icon: '🏠'
  }
];
