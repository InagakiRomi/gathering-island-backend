import { Migration } from '@mikro-orm/migrations';

export class Migration20260115030456 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table \`Participant\` (\`id\` integer not null primary key autoincrement, \`gathering\` integer not null, \`user\` integer not null, \`joinedAt\` datetime not null, constraint \`Participant_gathering_foreign\` foreign key(\`gathering\`) references \`Gathering\`(\`id\`) on update cascade, constraint \`Participant_user_foreign\` foreign key(\`user\`) references \`User\`(\`id\`) on update cascade);`);
    this.addSql(`create index \`Participant_gathering_index\` on \`Participant\` (\`gathering\`);`);
    this.addSql(`create index \`Participant_user_index\` on \`Participant\` (\`user\`);`);
    this.addSql(`create unique index \`Participant_gathering_user_unique\` on \`Participant\` (\`gathering\`, \`user\`);`);
  }

}
