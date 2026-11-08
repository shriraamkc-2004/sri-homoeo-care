-- Run once on existing databases after deploy
USE sri_homoeo_clinic;

UPDATE profiles SET password_hash = 'scrypt:20ef7a64e967432df7c6186a894d3006:31dfc1e7668d158c36dbc35046184f367b44c6d3e0fc5a507e737e414fe02d7fba204def07951adc403a120368c4e0b4ab635b0babb373a6da289bb3d4bd3c24' WHERE id = 'user-doctor';
UPDATE profiles SET password_hash = 'scrypt:6b4aeae1e5cb24ee04e0471c96a44b93:52f77cbffaa85a194461642d57da772525f3e3b8106e38a807c66edf3369501bea7b8a76bce68fd8eb1883457aca11975f87c3ffbe491fbdc5f7c6844fe35d80' WHERE id = 'user-admin';
UPDATE profiles SET password_hash = 'scrypt:adda89bf045800b8fd185043163e6563:3d910c56c55c5d221de09befe7c0708690a8cf7f8fe87c43491214fec2c413be564fa31abd8957960710534a15b9265b5ea3bcfb980e87bc16405f25566677a9' WHERE id = 'user-member';
UPDATE profiles SET password_hash = 'scrypt:0b257fcd8b87934a212b6aae9bffb4e9:cbcbd3b40f2953dcde5aaf99118a5cc19fb4dfa0b23ffeb7edf3736dd12a14583bebc700e7461decceedab80d48d54607525acd97e88dc0e42bdef04d32ddd62' WHERE id = 'patient-demo';

-- IMPORTANT: Change these temporary passwords immediately after first login.
-- Temporary passwords are documented only in CREDENTIALS_SETUP.md (do not commit real production secrets).
