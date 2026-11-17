export interface CoupleAccount {
  id?: string;
  username: string;
  password?: string;
  coupleNames: string;
  partnerOne: string;
  partnerTwo: string;
  anniversaryDate: string; // YYYY-MM-DD
  coupleCode: string;
  planTier: string;
  myRole?: 'partnerOne' | 'partnerTwo';
}

/**
 * Cuentas asignadas por administración.
 * Aquí puedes agregar o modificar los usuarios y contraseñas que entregarás a cada pareja.
 */
export const ASSIGNED_ACCOUNTS: CoupleAccount[] = [];

