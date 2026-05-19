CREATE USER ismslocal WITH PASSWORD 'ismslocal';
ALTER DATABASE "ISMS" OWNER TO ismslocal;
GRANT ALL ON SCHEMA public TO ismslocal;
ALTER SCHEMA public OWNER TO ismslocal;
