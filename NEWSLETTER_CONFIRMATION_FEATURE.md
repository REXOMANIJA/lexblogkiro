# Newsletter Confirmation Feature

## Pregled

Dodana je nova funkcionalnost koja automatski šalje email potvrdu kada se korisnik prijavi na newsletter.

## Šta je dodano

### 1. Nova Supabase Edge funkcija
- **Fajl**: `supabase/functions/send-subscription-confirmation/index.ts`
- **Svrha**: Šalje email potvrdu korisniku nakon prijave na newsletter
- **Koristi**: Brevo API za slanje email-ova

### 2. Ažuriran newsletter servis
- **Fajl**: `src/services/newsletter.ts`
- **Nova funkcija**: `sendSubscriptionConfirmation(email: string)`
- **Integracija**: Automatski poziva potvrdu nakon uspešne prijave

### 3. Ažurirana komponenta
- **Fajl**: `src/components/NewsletterSubscriptionForm.tsx`
- **Promena**: Poruka sada kaže "Proverite email za potvrdu"

### 4. Testovi
- **Fajl**: `src/services/newsletter-confirmation.test.ts`
- **Ažurirani**: `src/components/NewsletterSubscriptionForm.test.tsx`

## Kako funkcioniše

1. Korisnik unosi email i klikne "Prijavi me"
2. Email se dodaje u bazu podataka
3. Automatski se poziva funkcija za slanje potvrde
4. Korisnik dobija email sa potvrdnom porukom
5. Prikazuje se poruka "Uspešno ste se prijavili na Newsletter! Proverite email za potvrdu."

## Email template

Email potvrda sadrži:
- Dobrodošlicu na srpskom jeziku
- Potvrdu email adrese
- Objašnjenje šta korisnik može očekivati
- Link za odjavljivanje
- Profesionalan dizajn koji odgovara sajtu

## Konfiguracija

Koristi postojeću Brevo konfiguraciju iz `.env` fajla:
```
BREVO_API_KEY=your_api_key_here
```

## Testiranje

Pokretanje testova:
```bash
npm test -- newsletter-confirmation.test.ts
npm test -- NewsletterSubscriptionForm.test.tsx
```

## Napomene

- Ako slanje potvrde ne uspe, prijava na newsletter se i dalje smatra uspešnom
- Greške u slanju potvrde se loguju ali ne prekidaju proces
- Email template je optimizovan za Primary inbox placement
- Podržava i HTML i plain text verzije email-a