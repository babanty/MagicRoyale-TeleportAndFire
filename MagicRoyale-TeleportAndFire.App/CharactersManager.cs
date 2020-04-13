using MagicRoyale_TeleportAndFire.Entity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MagicRoyale_TeleportAndFire.App
{
    public class CharactersManager : ICharactersManager
    {
        private readonly MagicRoyaleDbContext _dbContext;

        public CharactersManager(MagicRoyaleDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<Character> Create()
        {
            var character = new Character { X = 0, Y = 0, Hp = 100, WorldId = default };

            _dbContext.Characters.Add(character);
            await _dbContext.SaveChangesAsync();

            return character;
        }
    }
}
