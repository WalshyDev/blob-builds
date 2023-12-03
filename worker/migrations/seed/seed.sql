INSERT INTO users (name, api_token) VALUES ('Slimefun', 'slimefun_api');
INSERT INTO users (name, api_token) VALUES ('Slimefun Community', 'slimefun_community_api');
INSERT INTO users (name, api_token) VALUES ('Jeff', 'jeff_api');
INSERT INTO users (name, api_token) VALUES ('Example', 'example_api');
INSERT INTO users (name, api_token) VALUES ('Walshy', 'qXgXPVPUHuKwERmXoNgTPZPKDuTD9xu4m6d6VzaqvDpYifeLQ8i6Fuzf2MyECmXQ');

INSERT INTO projects (user_id, name, description) VALUES (1, 'Slimefun4','Slimefun4 description');
INSERT INTO projects (user_id, name, description) VALUES (2, 'LiteXpansion','LiteXpansion description');
INSERT INTO projects (user_id, name, description) VALUES (2, 'HardcoreSlimefun','HardcoreSlimefun description');
INSERT INTO projects (user_id, name, description) VALUES (3, 'HeadLimiter','HeadLimiter description');
INSERT INTO projects (user_id, name, description) VALUES (3, 'LuckyPandas','LuckyPandas description');
INSERT INTO projects (user_id, name, description) VALUES (5, 'Test','Test description');

INSERT INTO release_channels (project_id, name, supported_versions, dependencies, file_naming) VALUES
	(1, 'Dev', '1.14.x-1.20.x', json('[]'), '$project.jar');
INSERT INTO release_channels (project_id, name, supported_versions, dependencies, file_naming) VALUES
	(1, 'RC', '1.14.x-1.20.x', json('[]'), '$project.jar');
INSERT INTO release_channels (project_id, name, supported_versions, dependencies, file_naming) VALUES
	(2, 'Dev', '1.14.x-1.20.x', json('[]'), '$project.jar');
INSERT INTO release_channels (project_id, name, supported_versions, dependencies, file_naming) VALUES
	(3, 'Dev', '1.14.x-1.20.x', json('[]'), '$project.jar');
INSERT INTO release_channels (project_id, name, supported_versions, dependencies, file_naming) VALUES
	(4, 'Dev', '1.14.x-1.20.x', json('[]'), '$project.jar');
INSERT INTO release_channels (project_id, name, supported_versions, dependencies, file_naming) VALUES
	(5, 'Dev', '1.14.x-1.20.x', json('[]'), '$project.jar');
INSERT INTO release_channels (project_id, name, supported_versions, dependencies, file_naming) VALUES
	(6, 'Dev', '1.14.x-1.20.x', json('[]'), '$project-$releaseChannel.jar');
