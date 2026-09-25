const unavailable = () => {
  throw new Error("Stripe Connect não está disponível neste ambiente.");
};

export class StripeSync {
  constructor() {
    unavailable();
  }
}

export async function runMigrations() {
  unavailable();
}
