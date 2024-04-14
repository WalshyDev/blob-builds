-- OAuth migration
-- This will set the oauth user IDs for everyone that is currently registered.
-- We had a strict policy before of knowing who everyone was and their GHs so we're safe to do this.
-- All IDs pulled from the GitHub API

-- This is a one-time migration. It will only run once.

-- We're gonna set an invalid ID for the orgs so we can make sure they're never used but the fields are still set.
UPDATE users SET oauth_provider = 'github', oauth_id = -1 WHERE user_id = 1 AND name = 'Slimefun';
UPDATE users SET oauth_provider = 'github', oauth_id = -1 WHERE user_id = 2 AND name = 'Slimefun-Addon-Community';

-- Normal users
UPDATE users SET oauth_provider = 'github', oauth_id = 44972470 WHERE user_id = 4 AND name = 'J3fftw'; -- J3fftw1
UPDATE users SET oauth_provider = 'github', oauth_id = 8492901 WHERE user_id = 5 AND name = 'Walshy'; -- WalshyDev
UPDATE users SET oauth_provider = 'github', oauth_id = 20646323 WHERE user_id = 6 AND name = 'Sefiraat';
UPDATE USERS SET oauth_provider = 'github', oauth_id = 7105953 WHERE user_id = 7 AND name = 'ybw0014';
UPDATE USERS SET oauth_provider = 'github', oauth_id = 88238718 WHERE user_id = 8 AND name = 'FN-FAL113';
UPDATE USERS SET oauth_provider = 'github', oauth_id = 46107752 WHERE user_id = 9 AND name = 'Silent'; -- TheSilentPro
UPDATE USERS SET oauth_provider = 'github', oauth_id = 35176119 WHERE user_id = 10 AND name = 'Idra'; -- LordIdra
UPDATE USERS SET oauth_provider = 'github', oauth_id = 45241413 WHERE user_id = 11 AND name = 'char321'; -- char3210
UPDATE USERS SET oauth_provider = 'github', oauth_id = 65748158 WHERE user_id = 12 AND name = 'JustAHuman-xD';
UPDATE USERS SET oauth_provider = 'github', oauth_id = 43350117 WHERE user_id = 13 AND name = 'ProfElements';
UPDATE USERS SET oauth_provider = 'github', oauth_id = 49963543 WHERE user_id = 14 AND name = 'Seggan';
UPDATE USERS SET oauth_provider = 'github', oauth_id = 103849596 WHERE user_id = 15 AND name = 'JasperChaseTOQ';
UPDATE USERS SET oauth_provider = 'github', oauth_id = 101147426 WHERE user_id = 16 AND name = 'SchnTgaiSpock';
UPDATE USERS SET oauth_provider = 'github', oauth_id = 31554056 WHERE user_id = 17 AND name = 'NCBPFluffyBear';
UPDATE USERS SET oauth_provider = 'github', oauth_id = 36118424 WHERE user_id = 18 AND name = 'RelativoBR';
UPDATE USERS SET oauth_provider = 'github', oauth_id = 37039432 WHERE user_id = 19 AND name = 'Sfiguz7';
UPDATE USERS SET oauth_provider = 'github', oauth_id = 71831019 WHERE user_id = 20 AND name = 'GallowsDove';
UPDATE USERS SET oauth_provider = 'github', oauth_id = 87692752 WHERE user_id = 21 AND name = 'CAPS123987';
