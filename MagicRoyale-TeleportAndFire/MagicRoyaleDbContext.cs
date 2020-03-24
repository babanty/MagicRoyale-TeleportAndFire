using System;
using Microsoft.EntityFrameworkCore;

namespace MagicRoyale_TeleportAndFire.App
{
    public class MagicRoyaleDbContext : DbContext
    {
        public DbSet<User> Users { get; set; }

        public MagicRoyaleDbContext(DbContextOptions<MagicRoyaleDbContext> options)
            : base(options)
        {
            Database.EnsureCreated();
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.UseSqlServer("Server=localhost;Database=TestDb;Trusted_Connection=True;MultipleActiveResultSets=true;Connect Timeout=15;Encrypt=False;Packet Size=4096");
        }
    }
}
