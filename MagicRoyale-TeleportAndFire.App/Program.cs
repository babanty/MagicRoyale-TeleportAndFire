using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace MagicRoyale_TeleportAndFire.App
{
public class Program
    {
        public static void Main(string[] args)
        {
            CreateHostBuilder(args).Build().Run();

            using (MagicRoyaleDbContext db = new MagicRoyaleDbContext())
            {
                // ������� ��� ������� User
                User user1 = new User { Name = "Tom" };
                User user2 = new User { Name = "Alice" };

                // ��������� �� � ��
                db.Users.Add(user1);
                db.Users.Add(user2);
                db.SaveChanges();
                Console.WriteLine("������� ������� ���������");

                // �������� ������� �� �� � ������� �� �������
                var users = db.Users.ToList();
                Console.WriteLine("������ ��������:");
                foreach (User u in users)
                {
                    Console.WriteLine(u.Name);
                }
            }
            Console.Read();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>();
                });
    }
}
