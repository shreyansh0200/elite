# AgriSync — City Hub Manager Demo Credentials

Run the seed script once against your MongoDB database:

```bash
npm run seed
```

Every hub manager is stored as a normal `User` document with `role=hubmanager` and a `city`. Adding another city later only requires creating another hub-manager user record in MongoDB (or through an admin/seeding workflow); the request routing is not hard-coded to one manager.

| City | Username | Password |
|---|---|---|
| Kanpur | hub_kanpur | Kanpur@123 |
| Lucknow | hub_lucknow | Lucknow@123 |
| Prayagraj | hub_prayagraj | Prayagraj@123 |
| Varanasi | hub_varanasi | Varanasi@123 |
| Agra | hub_agra | Agra@123 |
| Meerut | hub_meerut | Meerut@123 |
| Gorakhpur | hub_gorakhpur | Gorakhpur@123 |
| Bareilly | hub_bareilly | Bareilly@123 |
| Jhansi | hub_jhansi | Jhansi@123 |
| Aligarh | hub_aligarh | Aligarh@123 |

These are demo credentials. Change them before using the application outside a demo environment.
