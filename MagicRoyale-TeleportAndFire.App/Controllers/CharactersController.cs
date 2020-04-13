using MagicRoyale_TeleportAndFire.Entity;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MagicRoyale_TeleportAndFire.App.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CharactersController : ControllerBase
    {
        private readonly ICharactersManager _charactersManager;

        public CharactersController(ICharactersManager charactersManager)
        {
            _charactersManager = charactersManager;
        }

        [HttpPost, Consumes("application/json")]
        public async Task<Character> Create([FromBody] CreateCharacterRequest request)
        {
            return await _charactersManager.Create();
        }
    }
}
