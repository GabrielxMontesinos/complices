export interface CoupleAccount {
  username: string;
  password: string;
  coupleNames: string;
  partnerOne: string;
  partnerTwo: string;
  anniversaryDate: string; // YYYY-MM-DD
  coupleCode: string;
  planTier: string;
}

/**
 * Cuentas asignadas por administración.
 * Aquí puedes agregar o modificar los usuarios y contraseñas que entregarás a cada pareja.
 */
export const ASSIGNED_ACCOUNTS: CoupleAccount[] = [
  {
    username: 'pareja.vip',
    password: 'amor2026',
    coupleNames: 'Alejandro & Valentina',
    partnerOne: 'Alejandro',
    partnerTwo: 'Valentina',
    anniversaryDate: '2024-02-14',
    coupleCode: 'ALMA-2026',
    planTier: 'Edición Dorada Exclusiva',
  },
  {
    username: 'admin',
    password: '123456',
    coupleNames: 'Carlos & Sofía',
    partnerOne: 'Carlos',
    partnerTwo: 'Sofía',
    anniversaryDate: '2025-06-20',
    coupleCode: 'AMOR-7788',
    planTier: 'Acceso Pareja',
  },
];

