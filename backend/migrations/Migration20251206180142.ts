import { Migration } from '@mikro-orm/migrations';

export class Migration20251206180142 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "Gathering" ("id" serial primary key, "userId" int not null, "title" varchar(255) not null, "description" varchar(255) not null default '', "location" varchar(255) not null, "participantNumbers" int not null, "price" int not null, "status" varchar(255) not null default 'OPEN', "type" varchar(255) not null default 'PARTY', "startTime" timestamptz not null default '2099-12-25 00:00:00', "dueDate" timestamptz not null default '2099-12-31 23:59:59', "isArchived" boolean not null default false, "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now());`);
    this.addSql(`comment on column "Gathering"."updatedAt" is '更新時間';`);
    this.addSql(`create index "Gathering_updatedAt_index" on "Gathering" ("updatedAt");`);

    this.addSql(`create table "Tag" ("id" serial primary key, "tagName" varchar(255) not null);`);
    this.addSql(`alter table "Tag" add constraint "Tag_tagName_unique" unique ("tagName");`);

    this.addSql(`create table "Gathering_tags" ("gathering" int not null, "tag" int not null, constraint "Gathering_tags_pkey" primary key ("gathering", "tag"));`);

    this.addSql(`create table "User" ("id" serial primary key, "email" varchar(255) not null, "passwordHash" varchar(255) not null, "refreshTokenHash" varchar(255) not null default '', "displayName" varchar(255) not null, "role" varchar(255) not null default 'user', "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now());`);
    this.addSql(`comment on column "User"."updatedAt" is '更新時間';`);
    this.addSql(`alter table "User" add constraint "User_email_unique" unique ("email");`);
    this.addSql(`create index "User_updatedAt_index" on "User" ("updatedAt");`);

    this.addSql(`alter table "Gathering_tags" add constraint "Gathering_tags_gathering_foreign" foreign key ("gathering") references "Gathering" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table "Gathering_tags" add constraint "Gathering_tags_tag_foreign" foreign key ("tag") references "Tag" ("id") on update cascade on delete cascade;`);
  }

}
