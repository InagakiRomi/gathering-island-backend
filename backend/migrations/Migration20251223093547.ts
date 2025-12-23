import { Migration } from '@mikro-orm/migrations';

export class Migration20251223093547 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table \`Gathering\` (\`id\` integer not null primary key autoincrement, \`userId\` integer not null, \`title\` text not null, \`description\` text not null default '', \`location\` text not null, \`participantNumbers\` integer not null, \`price\` integer not null, \`status\` text not null default 'OPEN', \`type\` text not null default 'PARTY', \`startTime\` datetime not null default '2099-12-25 00:00:00', \`dueDate\` datetime not null default '2099-12-31 23:59:59', \`isArchived\` integer not null default false, \`createdAt\` datetime not null, \`updatedAt\` datetime not null);`);
    this.addSql(`create index \`Gathering_updatedAt_index\` on \`Gathering\` (\`updatedAt\`);`);

    this.addSql(`create table \`Tag\` (\`id\` integer not null primary key autoincrement, \`tagName\` text not null);`);
    this.addSql(`create unique index \`Tag_tagName_unique\` on \`Tag\` (\`tagName\`);`);

    this.addSql(`create table \`Gathering_tags\` (\`gathering\` integer not null, \`tag\` integer not null, constraint \`Gathering_tags_gathering_foreign\` foreign key(\`gathering\`) references \`Gathering\`(\`id\`) on delete cascade on update cascade, constraint \`Gathering_tags_tag_foreign\` foreign key(\`tag\`) references \`Tag\`(\`id\`) on delete cascade on update cascade, primary key (\`gathering\`, \`tag\`));`);
    this.addSql(`create index \`Gathering_tags_gathering_index\` on \`Gathering_tags\` (\`gathering\`);`);
    this.addSql(`create index \`Gathering_tags_tag_index\` on \`Gathering_tags\` (\`tag\`);`);

    this.addSql(`create table \`User\` (\`id\` integer not null primary key autoincrement, \`email\` text not null, \`passwordHash\` text not null, \`refreshTokenHash\` text not null default '', \`displayName\` text not null, \`role\` text not null default 'user', \`createdAt\` datetime not null, \`updatedAt\` datetime not null);`);
    this.addSql(`create unique index \`User_email_unique\` on \`User\` (\`email\`);`);
    this.addSql(`create index \`User_updatedAt_index\` on \`User\` (\`updatedAt\`);`);
  }

}
