# STASH – noliktavas vadības sistēma

React (Vite) + Express + SQLite. Trīs lomas: administrators, noliktavas darbinieks, plauktu kārtotājs.

## Palaišana

```bash
# 1) Server
cd server
cp .env.example .env        # then set a long random JWT_SECRET (min 32 chars)
npm install
npm run seed                # creates 3 test users, prints passwords ONCE
npm run dev                 # http://localhost:3001

# 2) Client (second terminal)
cd client
npm install
npm run dev                 # http://localhost:5173
```

To reset users: delete `server/stash.db` and run `npm run seed` again.

## Structure
- `server/src/permissions.js` – role → permission map (single source of truth)
- `server/src/middleware/auth.js` – `authenticate` + `requirePermission('x:y')`
- `server/src/routes/*` – API routes; every route uses the two middlewares above
- `client/src/context/AuthContext.jsx` – current user, `can('x:y')`
- `client/src/components/ProtectedRoute.jsx` – blocks pages by permission (UI only; server is the real check)

## Adding a new protected endpoint
```js
router.post('/', authenticate, requirePermission('product:create'), validate(schema), handler);
```

## Features per role
| | admin | darbinieks | kartotajs |
|---|---|---|---|
| Users: create / edit / change role / delete | yes | no | no |
| Products: view | yes | yes | yes (read only) |
| Products: add / edit | yes | yes | no |
| Products: delete | yes | no | no |
| Locations (shelf-row-slot): add / delete | yes | no | no |
| Orders: create, change status | no | yes | no |
| Placement: register / move / remove, update condition | no | no | yes |
| Reports | stock, orders, placement, activity log | stock, orders | stock, placement |

Rules enforced on the server: unique usernames/SKUs, no self-delete, no self-role-change, last admin protected,
order stock check + stock returned on cancel, order status flow (new → processing → packed → shipped, cancel before shipped),
one product per shelf slot, products in orders can't be deleted, CSV export protected against formula injection.
Every change is written to `audit_log` (shown in the admin activity report and the sorter's change history).

## Test checklist (run as each role, tick when it works)
| Test | admin | darbinieks | kartotajs |
|---|---|---|---|
| Login works, sidebar shows only allowed items | | | |
| /users in browser | table | 403 page | 403 page |
| Create user (duplicate name rejected) | | – | – |
| Add product (duplicate SKU rejected) | | | – |
| Delete product | | 403 | – |
| Create order > stock is rejected | – | | – |
| Cancel order returns stock | – | | – |
| Skip a status (new → shipped) is rejected | – | | – |
| Place product on shelf, occupied slot rejected | – | – | |
| Reports: forbidden types return 403 | | | |
| CSV download opens in Excel | | | |
