using System;
using Microsoft.EntityFrameworkCore;

namespace MagicRoyale_TeleportAndFire.App
{
    public class MagicRoyaleDbContext : DbContext
    {
        public DbSet<User> Users { get; set; }

        public MagicRoyaleDbContext()
        {
            Database.EnsureCreated();
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.UseSqlServer("Server=localhost;Database=master;Trusted_Connection=True;");
        }
    }
}
