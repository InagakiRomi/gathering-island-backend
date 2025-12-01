import { Migration } from '@mikro-orm/migrations';

export class Migration20251201104549 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table \`Gathering\` (\`id\` int unsigned not null auto_increment primary key, \`userId\` int not null, \`title\` varchar(255) not null, \`description\` varchar(255) not null default '', \`location\` varchar(255) not null, \`participantNumbers\` int not null, \`price\` int not null, \`status\` varchar(255) not null default 'OPEN', \`type\` varchar(255) not null default 'PARTY', \`startTime\` datetime not null default '2099-12-25 00:00:00', \`dueDate\` datetime not null default '2099-12-31 23:59:59', \`isArchived\` tinyint(1) not null default false, \`createdAt\` datetime not null default now(), \`updatedAt\` datetime not null default now() comment '更新時間') default character set utf8mb4 engine = InnoDB;`);
    this.addSql(`alter table \`Gathering\` add index \`Gathering_updatedAt_index\`(\`updatedAt\`);`);

    this.addSql(`create table \`Tag\` (\`id\` int unsigned not null auto_increment primary key, \`tagName\` varchar(255) not null) default character set utf8mb4 engine = InnoDB;`);
    this.addSql(`alter table \`Tag\` add unique \`Tag_tagName_unique\`(\`tagName\`);`);

    this.addSql(`create table \`Gathering_tags\` (\`gathering\` int unsigned not null, \`tag\` int unsigned not null, primary key (\`gathering\`, \`tag\`)) default character set utf8mb4 engine = InnoDB;`);
    this.addSql(`alter table \`Gathering_tags\` add index \`Gathering_tags_gathering_index\`(\`gathering\`);`);
    this.addSql(`alter table \`Gathering_tags\` add index \`Gathering_tags_tag_index\`(\`tag\`);`);

    this.addSql(`create table \`User\` (\`id\` int unsigned not null auto_increment primary key, \`email\` varchar(255) not null, \`passwordHash\` varchar(255) not null, \`refreshTokenHash\` varchar(255) not null default '', \`displayName\` varchar(255) not null, \`role\` varchar(255) not null default 'user', \`createdAt\` datetime not null default now(), \`updatedAt\` datetime not null default now() comment '更新時間') default character set utf8mb4 engine = InnoDB;`);
    this.addSql(`alter table \`User\` add unique \`User_email_unique\`(\`email\`);`);
    this.addSql(`alter table \`User\` add index \`User_updatedAt_index\`(\`updatedAt\`);`);

    this.addSql(`alter table \`Gathering_tags\` add constraint \`Gathering_tags_gathering_foreign\` foreign key (\`gathering\`) references \`Gathering\` (\`id\`) on update cascade on delete cascade;`);
    this.addSql(`alter table \`Gathering_tags\` add constraint \`Gathering_tags_tag_foreign\` foreign key (\`tag\`) references \`Tag\` (\`id\`) on update cascade on delete cascade;`);
  }

}
