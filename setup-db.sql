-- Local PostgreSQL setup for the Leave Management System.
--
-- Run it once as the postgres superuser:
--     sudo -u postgres psql -f setup-db.sql
--
-- The backend reads these same values from application.properties
-- (and they can be overridden with the DB_URL / DB_USERNAME / DB_PASSWORD
-- environment variables).

CREATE ROLE leave_user WITH LOGIN PASSWORD 'leave_password';

CREATE DATABASE leave_db OWNER leave_user;

-- Spring Boot + Hibernate create the tables themselves on first start
-- (spring.jpa.hibernate.ddl-auto=update), so there are no CREATE TABLE
-- statements here.
