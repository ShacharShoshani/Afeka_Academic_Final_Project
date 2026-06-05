# Livin — Demo Checklist

## Before the demo

### Start the stack
```bash
docker compose up -d db          # PostgreSQL on :5433
npm run dev:backend               # Express + Socket.io on :3000
npm run dev:frontend              # Angular dev server on :4200
```

### Pre-create accounts
Open two browser windows (or two different browsers to avoid cookie conflicts).

**Account A — Pet Owner**
- Name: Tali Cohen
- Role: Owner
- Location: Tel Aviv (use Google Places autocomplete in step 2)
- Care types: Dogs, Cats
- Registration completes → lands on /home

**Account B — Caretaker**
- Name: Noa Levi
- Role: Caretaker
- Location: Tel Aviv area (same city, close enough to match)
- Care types: Dogs, Cats, Plants
- Availability: Mornings, Weekends

---

## Demo flow (in order)

### 1. Mode selection (Settings)
- Account A → Settings → select **Swipe Mode**
- Show the bottom navigation replacing the top bar

### 2. Matching Preferences
- Account A → Settings → Matching Preferences
- Set care types: Dogs
- Set max distance: 50 km
- Save

### 3. Swipe deck (Jobs Search tab)
- Account A sees Noa's card with name, role badge, age, availability chips
- Swipe right on Noa
- Switch to Account B → swipe right on Tali
- **Account B** sees the "It's a Match!" modal with Tali's photo
- **Account A** (still on another tab) sees the green toast: "💚 New match with Tali Cohen!"
- Bell icon badge increments to 1

### 4. Notifications
- Account A taps bell → /notifications → sees "New match" entry
- Tap notification → navigates to the chat

### 5. Real-time chat (Chats tab)
- Open chat between Tali and Noa
- Account A types "Hi Noa! Looking forward to meeting." → send
- **Account B's chat updates instantly** without refresh
- Both see the dual confirm bar: "You: Pending · [Other]: Pending"
- Send an emoji and an image attachment to demonstrate chat features

### 6. Confirm the job
- Account A taps **Confirm Job** → bar shows "You ✓ · Noa: Pending"
- Account B sees the banner update instantly (Socket.io)
- Account B taps **Confirm Job** → "✓ Confirmed by both sides"
- Connection moves from **Chats** to **Jobs Confirmed**

### 7. Jobs Confirmed
- Account A → Jobs Confirmed tab → sees the job card with "⚠️ Add job details"
- Tap **Edit Details** → fill in dates (next weekend), amount 150 ILS/daily
- Save → card now shows the dates and payment
- Tap **▶ Start Job** → status changes to "In Progress"
- Tap **✓ Mark Complete** → status "Completed"

### 8. Reviews
- Account A → Jobs Confirmed → ⭐ Review → 5 stars + comment → Submit
- Account B opens Noa's public profile (/users/:id) → sees ⭐ 5.0 · 1 review badge

### 9. Block / Report (safety)
- Account A opens any public profile → tap 🚫 to block
- Account A goes back to swipe deck — blocked user no longer appears
- Account A taps ⚑ Report on another profile → fill in category + description → submit
- Admin account → Settings → "Admin Reports" → sees the report, change status to "Under Review"

### 10. Password features
- From the login page tap **Forgot password?**
- Enter email → token returned (dev mode)
- Copy token → navigate to reset → set new password → log in with it
- Settings → Change Password → update and confirm

### 11. Switch back to Job Post Mode
- Settings → App Mode → **Job Post Mode**
- Top navbar + Google Map reappear
- Browse grid, create/edit jobs — unchanged from original flow

---

## Key things to highlight

| Feature | Where |
|---|---|
| Real-time chat | Two open browser windows — message appears instantly |
| Socket.io match toast | Account A waiting while B swipes |
| Persistent notifications | Bell badge survives page refresh |
| Geo filtering | Set maxDistanceKm small enough to exclude a far user |
| Rating on swipe card | After review, ⭐ badge appears on card |
| Cancelled match | Decline → "Closed matches" section in Chats |
| Admin panel | Admin user → Settings → 🛡 Admin Reports |

---

## Run tests before presenting

```bash
# Backend (12 tests — pure utilities)
cd backend && npm test

# Frontend (61 tests — formatting helpers + swipe helpers + registration)
cd frontend && npm test
```

All should pass green.
